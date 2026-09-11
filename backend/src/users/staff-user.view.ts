import { User, UserRole, UserStatus } from "@prisma/client";

/// What a staff-management response may ever contain. Never passwordHash,
/// never the reset/invitation token fields — those are secrets, this is a
/// directory listing. `invitationPending` is derived: the person has never
/// set a password, so their invitation is still outstanding and may be
/// re-sent (users.service.ts resendInvitation).
export interface StaffUserView {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  invitationPending: boolean;
  createdAt: Date;
}

export function toStaffUserView(user: User): StaffUserView {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    invitationPending: user.passwordSetAt === null,
    createdAt: user.createdAt,
  };
}
