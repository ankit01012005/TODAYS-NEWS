import { NextFunction, Request, Response } from "express";
import { prisma } from "../../db";
import { config } from "../../config";
import { hashToken } from "../token.util";
import { UnauthorizedError } from "../http-errors";

/// Mounted once, after every genuinely public route has already been
/// registered (see app.ts) — everything below it denies by default (SEC-01).
/// Cookie -> session lookup -> user -> req.user, per docs/23 §11.1's chain.
/// Capability/ownership checks are downstream, not here.
export async function sessionAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const rawToken = req.cookies?.[config.SESSION_COOKIE_NAME];
  if (!rawToken) {
    throw new UnauthorizedError("Sign-in required");
  }

  const tokenHash = hashToken(rawToken);
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
  next();
}
