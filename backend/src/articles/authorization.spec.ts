import { assertOwnerOrAdmin } from "./authorization";
import { AuthenticatedUser } from "../common/authenticated-user";
import { NotFoundError } from "../common/http-errors";

const editor: AuthenticatedUser = { id: "editor-1", email: "e@test.local", displayName: "E", role: "EDITOR" };
const otherEditor: AuthenticatedUser = { id: "editor-2", email: "e2@test.local", displayName: "E2", role: "EDITOR" };
const admin: AuthenticatedUser = { id: "admin-1", email: "a@test.local", displayName: "A", role: "ADMIN" };

describe("assertOwnerOrAdmin", () => {
  it("allows the owning editor", () => {
    expect(() => assertOwnerOrAdmin(editor, { ownerId: editor.id })).not.toThrow();
  });

  it("allows any admin, regardless of ownership", () => {
    expect(() => assertOwnerOrAdmin(admin, { ownerId: editor.id })).not.toThrow();
  });

  it("refuses a different editor as NotFoundError — SEC-03, not 403", () => {
    expect(() => assertOwnerOrAdmin(otherEditor, { ownerId: editor.id })).toThrow(NotFoundError);
  });
});
