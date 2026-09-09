/// Mirrors backend/src/common/authenticated-user.ts.
export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: "EDITOR" | "ADMIN";
}
