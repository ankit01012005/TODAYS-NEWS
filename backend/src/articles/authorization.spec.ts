import { assertNotSelfApproval, assertOwnerOrAdmin } from "./authorization";
import { AuthenticatedUser } from "../common/authenticated-user";
import { ForbiddenError, NotFoundError } from "../common/http-errors";

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

describe("assertNotSelfApproval — BR-13", () => {
  it("refuses when the admin is the article owner", () => {
    expect(() =>
      assertNotSelfApproval(admin, { ownerId: admin.id }, { createdByUserId: editor.id }),
    ).toThrow(ForbiddenError);
  });

  it("refuses when the admin is the revision's author, even if not the owner", () => {
    expect(() =>
      assertNotSelfApproval(admin, { ownerId: editor.id }, { createdByUserId: admin.id }),
    ).toThrow(ForbiddenError);
  });

  it("allows a different admin who is neither owner nor author", () => {
    expect(() =>
      assertNotSelfApproval(admin, { ownerId: editor.id }, { createdByUserId: editor.id }),
    ).not.toThrow();
  });
});
