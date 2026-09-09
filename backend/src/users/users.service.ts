import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "../auth/auth.service";
import { StaffUserView, toStaffUserView } from "./staff-user.view";

/// The exact text the BR-14 trigger (migration.sql, Phase 4B §2.7) raises.
/// Matched here so the raw Postgres exception never reaches a client
/// (SEC-06) — it becomes a clean, expected 409 instead.
const LAST_ACTIVE_ADMIN_MARKER = "at least one active admin must exist";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async invite(
    email: string,
    displayName: string,
    role: UserRole,
  ): Promise<{ user: StaffUserView; invitationToken: string }> {
    // Unusable until the invitation is accepted — a valid-shaped hash that
    // matches no real password (nobody knows the random value).
    const placeholderPasswordHash = await argon2.hash(randomBytes(32).toString("hex"));

    const user = await this.prisma.user.create({
      data: { email, displayName, role, passwordHash: placeholderPasswordHash },
    });
    const invitationToken = await this.auth.issueInvitationToken(user.id);

    return { user: toStaffUserView(user), invitationToken };
  }

  async list(): Promise<StaffUserView[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return users.map(toStaffUserView);
  }

  async changeRole(userId: string, role: UserRole): Promise<StaffUserView> {
    const user = await this.runGuardedByLastAdminRule(() =>
      this.prisma.user.update({ where: { id: userId }, data: { role } }),
    );
    return toStaffUserView(user);
  }

  async deactivate(userId: string): Promise<StaffUserView> {
    const user = await this.runGuardedByLastAdminRule(() =>
      this.prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: userId },
          data: { status: "DEACTIVATED", deactivatedAt: new Date() },
        });
        // SEC-05: deactivation ends every session immediately, not just on
        // their next expiry check.
        await tx.session.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return updated;
      }),
    );
    return toStaffUserView(user);
  }

  async reactivate(userId: string): Promise<StaffUserView> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE", deactivatedAt: null },
    });
    return toStaffUserView(user);
  }

  private async runGuardedByLastAdminRule<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error && error.message.includes(LAST_ACTIVE_ADMIN_MARKER)) {
        throw new ConflictException(
          "This would leave no active admin. At least one must always remain (BR-14).",
        );
      }
      if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2025") {
        throw new NotFoundException("No such user");
      }
      throw error;
    }
  }
}
