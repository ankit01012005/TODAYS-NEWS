import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CapabilityGuard } from "./capability.guard";
import { AuthenticatedUser } from "../authenticated-user";

function makeContext(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe("CapabilityGuard", () => {
  it("allows the request through when no capability is required", () => {
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;
    const guard = new CapabilityGuard(reflector);
    expect(guard.canActivate(makeContext(undefined))).toBe(true);
  });

  it("allows a user whose role holds the required capability", () => {
    const reflector = { getAllAndOverride: () => "review:publish" } as unknown as Reflector;
    const guard = new CapabilityGuard(reflector);
    const admin: AuthenticatedUser = {
      id: "1",
      email: "admin@test.local",
      displayName: "Admin",
      role: "ADMIN",
    };
    expect(guard.canActivate(makeContext(admin))).toBe(true);
  });

  it("refuses a user whose role lacks the required capability — BR-05", () => {
    const reflector = { getAllAndOverride: () => "review:publish" } as unknown as Reflector;
    const guard = new CapabilityGuard(reflector);
    const editor: AuthenticatedUser = {
      id: "2",
      email: "editor@test.local",
      displayName: "Editor",
      role: "EDITOR",
    };
    expect(() => guard.canActivate(makeContext(editor))).toThrow(ForbiddenException);
  });

  it("refuses when there is no user on the request at all", () => {
    const reflector = { getAllAndOverride: () => "user:manage" } as unknown as Reflector;
    const guard = new CapabilityGuard(reflector);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});
