import { Request, Response } from "express";
import { requireCapability } from "./require-capability.middleware";
import { AuthenticatedUser } from "../authenticated-user";
import { ForbiddenError } from "../http-errors";

function makeRequest(user: AuthenticatedUser | undefined): Request {
  return { user } as unknown as Request;
}

describe("requireCapability middleware", () => {
  it("calls next() when the user's role holds the required capability", () => {
    const admin: AuthenticatedUser = {
      id: "1",
      email: "admin@test.local",
      displayName: "Admin",
      role: "ADMIN",
    };
    const next = jest.fn();
    requireCapability("review:publish")(makeRequest(admin), {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("throws ForbiddenError when the user's role lacks the capability — BR-05", () => {
    const editor: AuthenticatedUser = {
      id: "2",
      email: "editor@test.local",
      displayName: "Editor",
      role: "EDITOR",
    };
    const next = jest.fn();
    expect(() =>
      requireCapability("review:publish")(makeRequest(editor), {} as Response, next),
    ).toThrow(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError when there is no user on the request at all", () => {
    const next = jest.fn();
    expect(() =>
      requireCapability("user:manage")(makeRequest(undefined), {} as Response, next),
    ).toThrow(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });
});
