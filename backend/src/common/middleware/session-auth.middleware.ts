import { NextFunction, Request, Response } from "express";
import { prisma } from "../../db";
import { config } from "../../config";
import { hashToken } from "../token.util";
import { UnauthorizedError } from "../http-errors";
import { cacheSession, getCachedSession } from "../session-cache";

/// Mounted once, after every genuinely public route has already been
/// registered (see app.ts) — everything below it denies by default (SEC-01).
/// Cookie -> session lookup -> user -> req.user, per docs/23 §11.1's chain.
/// Capability/ownership checks are downstream, not here.
///
/// The lookup is served from a short-lived in-process cache when it can be
/// (common/session-cache.ts) — the database is a ~250 ms round trip away
/// and this runs on every authenticated request. Every path that revokes
/// or changes a session evicts its cache entry, so revocation stays
/// immediate (SEC-05).
export async function sessionAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const rawToken = req.cookies?.[config.SESSION_COOKIE_NAME];
  if (!rawToken) {
    throw new UnauthorizedError("Sign-in required");
  }

  const tokenHash = hashToken(rawToken);
  const cached = getCachedSession(tokenHash);
  if (cached) {
    req.user = cached.user;
    next();
    return;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const now = new Date();
  if (
    !session ||
    session.revokedAt !== null ||
    session.expiresAt <= now ||
    session.user.status !== "ACTIVE"
  ) {
    throw new UnauthorizedError("Session is invalid or has expired");
  }

  req.user = {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role,
  };
  cacheSession(tokenHash, req.user, session.expiresAt);
  next();
}
