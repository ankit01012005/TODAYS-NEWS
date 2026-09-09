import { User, UserRole, UserStatus } from "@prisma/client";

/// What a staff-management response may ever contain. Never passwordHash,
/// never the reset/invitation token fields — those are secrets, this is a
/// directory listing.
export interface StaffUserView {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export function toStaffUserView(user: User): StaffUserView {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}
