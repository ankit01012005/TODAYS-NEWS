import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AppEnv } from "../config/env.validation";
import { AuthenticatedUser } from "../common/authenticated-user";
import { generateOpaqueToken, hashToken } from "../common/token.util";

const INVITATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  /// P2-11: one generic failure for every cause — unknown email, wrong
  /// password and a deactivated account must be indistinguishable to the
  /// caller. Only the exact wording differs from a plain "invalid
  /// credentials" when we deliberately want it to (we don't, here).
  async signIn(email: string, password: string): Promise<{ rawToken: string; user: AuthenticatedUser }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const genericFailure = () => new UnauthorizedException("Invalid email or password");

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
    const ttlHours = this.config.get("SESSION_TTL_HOURS", { infer: true });
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
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

  async signOut(rawToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /// Same mechanism backs admin-invites-a-user and forgot-password
  /// (docs/23 §11.3). Returns the raw token so the caller can hand it back
  /// in the response — there is no email provider configured yet (a
  /// deliberate, disclosed gap for this phase, not a silent one).
  async issueSetPasswordToken(userId: string, ttlMs: number): Promise<string> {
    const { raw, hash } = generateOpaqueToken();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetTokenHash: hash,
        passwordResetExpiresAt: new Date(Date.now() + ttlMs),
      },
    });
    return raw;
  }

  issueInvitationToken(userId: string): Promise<string> {
    return this.issueSetPasswordToken(userId, INVITATION_TOKEN_TTL_MS);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.status === "ACTIVE") {
      await this.issueSetPasswordToken(user.id, PASSWORD_RESET_TOKEN_TTL_MS);
    }
    // Deliberately no return value either way — the controller sends the
    // same generic response whether or not the account exists (P2-11-style).
  }

  /// Spends a set-password token (invitation or reset — same table, same
  /// rule) and sets the new password. A generic failure either way: an
  /// unknown/expired/already-used token all look identical to the caller.
  async setPasswordWithToken(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const user = await this.prisma.user.findUnique({ where: { passwordResetTokenHash: tokenHash } });

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      throw new UnauthorizedException("This link is invalid or has expired");
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
  }
}
