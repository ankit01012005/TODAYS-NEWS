import { UserRole } from "@prisma/client";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { prisma } from "../db";
import { issueInvitationToken } from "../auth/auth.service";
import { StaffUserView, toStaffUserView } from "./staff-user.view";
import { ConflictError, NotFoundError } from "../common/http-errors";

/// The exact text the BR-14 triggers raise (migration.sql, Phase 4B §2.7 and
/// 20260911020000_admin_review_only_and_single_admin). Matched here so the
/// raw Postgres exception never reaches a client (SEC-06) — it becomes a
/// clean, expected 409 instead. BR-14 now bounds the admin count on both
/// sides: never zero, never more than one.
const LEAST_ONE_ACTIVE_ADMIN_MARKER = "at least one active admin must exist";
const MOST_ONE_ACTIVE_ADMIN_MARKER = "at most one active admin may exist";

export async function invite(
  email: string,
  displayName: string,
  role: UserRole,
): Promise<{ user: StaffUserView; invitationToken: string }> {
  // Unusable until the invitation is accepted — a valid-shaped hash that
  // matches no real password (nobody knows the random value).
  const placeholderPasswordHash = await argon2.hash(randomBytes(32).toString("hex"));

  const user = await runGuardedByAdminInvariants(async () => {
    try {
      return await prisma.user.create({
        data: { email, displayName, role, passwordHash: placeholderPasswordHash },
      });
    } catch (error) {
      if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002") {
        throw new ConflictError("An account with this email already exists");
      }
      throw error;
    }
  });
  const invitationToken = await issueInvitationToken(user.id);

  return { user: toStaffUserView(user), invitationToken };
}

export async function list(): Promise<StaffUserView[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return users.map(toStaffUserView);
}

export async function changeRole(userId: string, role: UserRole): Promise<StaffUserView> {
  const user = await runGuardedByAdminInvariants(() =>
    prisma.user.update({ where: { id: userId }, data: { role } }),
  );
  return toStaffUserView(user);
}

export async function deactivate(userId: string): Promise<StaffUserView> {
  const user = await runGuardedByAdminInvariants(() =>
    prisma.$transaction(async (tx) => {
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

export async function reactivate(userId: string): Promise<StaffUserView> {
  // A deactivated admin can be reactivated straight back into a second
  // active admin — guarded the same as invite()/changeRole() (BR-14).
  const user = await runGuardedByAdminInvariants(() =>
    prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE", deactivatedAt: null },
    }),
  );
  return toStaffUserView(user);
}

async function runGuardedByAdminInvariants<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error && error.message.includes(LEAST_ONE_ACTIVE_ADMIN_MARKER)) {
      throw new ConflictError(
        "This would leave no active admin. At least one must always remain (BR-14).",
      );
    }
    if (error instanceof Error && error.message.includes(MOST_ONE_ACTIVE_ADMIN_MARKER)) {
      throw new ConflictError(
        "Only one active admin may exist at a time (BR-14). Deactivate or demote the current admin first.",
      );
    }
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2025") {
      throw new NotFoundError("No such user");
    }
    throw error;
  }
}
