import { UserRole } from "@prisma/client";

/// What sessionAuth middleware attaches to the request. Deliberately not
/// the full Prisma User row — never passwordHash, never token fields — just
/// enough for downstream middleware/routes to make authorisation decisions.
export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
