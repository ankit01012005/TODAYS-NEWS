import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { prisma } from "../db";
import { config } from "../config";
import { AuthenticatedUser } from "../common/authenticated-user";
import { generateOpaqueToken, hashToken } from "../common/token.util";
import { BadRequestError, UnauthorizedError } from "../common/http-errors";
import { appLink, mailer, passwordResetEmail } from "../mail";

export const INVITATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/// P2-11: one generic failure for every cause — unknown email, wrong
/// password and a deactivated account must be indistinguishable to the
/// caller. Only the exact wording differs from a plain "invalid
/// credentials" when we deliberately want it to (we don't, here).
export async function signIn(
  email: string,
  password: string,
): Promise<{ rawToken: string; user: AuthenticatedUser }> {
  const user = await prisma.user.findUnique({ where: { email } });
  const genericFailure = () => new UnauthorizedError("Invalid email or password");

  if (!user || user.status !== "ACTIVE") {
    // Still run a hash so response timing doesn't reveal "no such user".
    await argon2.hash(randomBytes(16).toString("hex"));
    throw genericFailure();
  }

  const passwordValid = await argon2.verify(user.passwordHash, password).catch(() => false);
  if (!passwordValid) {
    throw genericFailure();
  }

  const { raw, hash } = generateOpaqueToken();
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + config.SESSION_TTL_HOURS * 60 * 60 * 1000),
    },
  });

  return {
    rawToken: raw,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  };
}

export async function signOut(rawToken: string): Promise<void> {
  await prisma.session.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/// Same mechanism backs admin-invites-a-user and forgot-password
/// (docs/23 §11.3). Returns the raw token; the caller puts it into the
/// email (users.service.ts / requestPasswordReset below) and never into
/// an API response unless the mail transport is the development console.
export async function issueSetPasswordToken(userId: string, ttlMs: number): Promise<string> {
  const { raw, hash } = generateOpaqueToken();
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetTokenHash: hash,
      passwordResetExpiresAt: new Date(Date.now() + ttlMs),
    },
  });
  return raw;
}

export function issueInvitationToken(userId: string): Promise<string> {
  return issueSetPasswordToken(userId, INVITATION_TOKEN_TTL_MS);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.status === "ACTIVE") {
    const rawToken = await issueSetPasswordToken(user.id, PASSWORD_RESET_TOKEN_TTL_MS);
    // Not awaited: the response must take the same time whether or not
    // the account exists (P2-11), and an SMTP round-trip only happens for
    // real accounts. A delivery failure is logged, never surfaced.
    void mailer
      .send(
        passwordResetEmail({
          to: user.email,
          link: appLink("/staff/reset-password", rawToken),
          expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MS / 60_000,
        }),
      )
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error(
          JSON.stringify({
            time: new Date().toISOString(),
            level: "error",
            event: "mail.reset.failed",
            userId: user.id,
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      });
  }
  // Deliberately no return value either way — the router sends the same
  // generic response whether or not the account exists (P2-11-style).
}

/// SEC-05's spirit (docs/27 A4): a new password ends every session that
/// was opened with the old one — including any an attacker holds. The
/// caller's own current session, if any, is kept so a profile change
/// doesn't sign the person out mid-flow.
async function revokeOtherSessions(userId: string, keepRawToken?: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(keepRawToken ? { NOT: { tokenHash: hashToken(keepRawToken) } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

/// Spends a set-password token (invitation or reset — same table, same
/// rule) and sets the new password. A generic failure either way: an
/// unknown/expired/already-used token all look identical to the caller.
///
/// The token is consumed in ONE conditional write (docs/27 A4): the UPDATE
/// only matches while the hash is still present and unexpired, so two
/// requests racing with the same link cannot both succeed — the second
/// finds nothing to update and gets the same generic failure.
export async function setPasswordWithToken(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const genericFailure = () => new UnauthorizedError("This link is invalid or has expired");

  // The read only tells us WHICH account to revoke sessions for; whether
  // the token is still spendable is decided by the guarded write below.
  const candidate = await prisma.user.findUnique({
    where: { passwordResetTokenHash: tokenHash },
    select: { id: true },
  });
  if (!candidate) throw genericFailure();

  const passwordHash = await argon2.hash(newPassword);
  const consumed = await prisma.user.updateMany({
    where: {
      id: candidate.id,
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
      status: "ACTIVE",
    },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      passwordSetAt: new Date(),
    },
  });
  if (consumed.count === 0) throw genericFailure();

  await revokeOtherSessions(candidate.id);
}

/// docs/09 E-10 / docs/12 PG-EDT-10 — self-service profile update. Role is
/// deliberately not a field this function ever touches — there is no
/// self-promotion route, by construction (USR-02), not by omission from a
/// generic "update user" call that happens not to expose it.
export async function updateProfile(
  userId: string,
  input: { displayName?: string; currentPassword?: string; newPassword?: string },
  currentSessionRawToken?: string,
): Promise<AuthenticatedUser> {
  const data: { displayName?: string; passwordHash?: string; passwordSetAt?: Date } = {};

  if (input.displayName !== undefined) {
    data.displayName = input.displayName;
  }

  if (input.newPassword !== undefined) {
    if (!input.currentPassword) {
      throw new BadRequestError("currentPassword is required to set a new password");
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const currentPasswordValid = await argon2
      .verify(user.passwordHash, input.currentPassword)
      .catch(() => false);
    if (!currentPasswordValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }
    data.passwordHash = await argon2.hash(input.newPassword);
    data.passwordSetAt = new Date();
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });
  if (data.passwordHash) {
    await revokeOtherSessions(userId, currentSessionRawToken);
  }
  return {
    id: updated.id,
    email: updated.email,
    displayName: updated.displayName,
    role: updated.role,
  };
}
