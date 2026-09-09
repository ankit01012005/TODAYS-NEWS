import { UserRole } from "@prisma/client";

/// What SessionAuthGuard attaches to the request. Deliberately not the full
/// Prisma User row — never passwordHash, never token fields — just enough
/// for guards/services to make authorisation decisions.
export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}
