import * as argon2 from "argon2";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

function makeConfig(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    SESSION_TTL_HOURS: 1,
    SESSION_COOKIE_NAME: "today_news_session",
    NODE_ENV: "test",
    ...overrides,
  };
  return { get: (key: string) => values[key] } as never;
}

describe("AuthService", () => {
  const KNOWN_PASSWORD = "correct horse battery staple";
  let knownPasswordHash: string;

  beforeAll(async () => {
    knownPasswordHash = await argon2.hash(KNOWN_PASSWORD);
  });

  function makePrisma() {
    return {
      user: { findUnique: jest.fn(), update: jest.fn() },
      session: { create: jest.fn(), updateMany: jest.fn() },
    };
  }

  it("refuses sign-in for an unknown email with the generic message", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    const auth = new AuthService(prisma as never, makeConfig());

    await expect(auth.signIn("nobody@test.local", "whatever")).rejects.toThrow(
      new UnauthorizedException("Invalid email or password"),
    );
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it("refuses sign-in for a deactivated account with the SAME generic message — P2-11", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "editor@test.local",
      passwordHash: knownPasswordHash,
      status: "DEACTIVATED",
    });
    const auth = new AuthService(prisma as never, makeConfig());

    await expect(auth.signIn("editor@test.local", KNOWN_PASSWORD)).rejects.toThrow(
      new UnauthorizedException("Invalid email or password"),
    );
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it("refuses sign-in for the wrong password with the same generic message", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "editor@test.local",
      passwordHash: knownPasswordHash,
      status: "ACTIVE",
    });
    const auth = new AuthService(prisma as never, makeConfig());

    await expect(auth.signIn("editor@test.local", "wrong password")).rejects.toThrow(
      new UnauthorizedException("Invalid email or password"),
    );
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it("issues a session on correct credentials, never returning the password hash", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "editor@test.local",
      displayName: "Editor One",
      role: "EDITOR",
      passwordHash: knownPasswordHash,
      status: "ACTIVE",
    });
    const auth = new AuthService(prisma as never, makeConfig());

    const result = await auth.signIn("editor@test.local", KNOWN_PASSWORD);

    expect(result.rawToken).toEqual(expect.any(String));
    expect(result.user).toEqual({
      id: "u1",
      email: "editor@test.local",
      displayName: "Editor One",
      role: "EDITOR",
    });
    expect(Object.keys(result.user)).not.toContain("passwordHash");
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });

  it("refuses to set a password with an unknown or expired token", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    const auth = new AuthService(prisma as never, makeConfig());

    await expect(auth.setPasswordWithToken("bogus-token", "a-new-password")).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("refuses an expired token even if it otherwise matches a user", async () => {
    const prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordResetTokenHash: "irrelevant-because-mocked-lookup",
      passwordResetExpiresAt: new Date(Date.now() - 1000),
    });
    const auth = new AuthService(prisma as never, makeConfig());

    await expect(auth.setPasswordWithToken("some-token", "a-new-password")).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
