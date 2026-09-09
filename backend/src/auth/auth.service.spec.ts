import * as argon2 from "argon2";

jest.mock("../db", () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    session: { create: jest.fn(), updateMany: jest.fn() },
  },
}));
jest.mock("../config", () => ({
  config: { SESSION_TTL_HOURS: 1, SESSION_COOKIE_NAME: "today_news_session", NODE_ENV: "test" },
}));

// Imported AFTER the mocks above so auth.service picks up the mocked modules.
import { prisma } from "../db";
import * as auth from "./auth.service";
import { UnauthorizedError } from "../common/http-errors";

const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock };
  session: { create: jest.Mock; updateMany: jest.Mock };
};

describe("auth.service", () => {
  const KNOWN_PASSWORD = "correct horse battery staple";
  let knownPasswordHash: string;

  beforeAll(async () => {
    knownPasswordHash = await argon2.hash(KNOWN_PASSWORD);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refuses sign-in for an unknown email with the generic message", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await expect(auth.signIn("nobody@test.local", "whatever")).rejects.toThrow(
      new UnauthorizedError("Invalid email or password"),
    );
    expect(mockedPrisma.session.create).not.toHaveBeenCalled();
  });

  it("refuses sign-in for a deactivated account with the SAME generic message — P2-11", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "editor@test.local",
      passwordHash: knownPasswordHash,
      status: "DEACTIVATED",
    });

    await expect(auth.signIn("editor@test.local", KNOWN_PASSWORD)).rejects.toThrow(
      new UnauthorizedError("Invalid email or password"),
    );
    expect(mockedPrisma.session.create).not.toHaveBeenCalled();
  });

  it("refuses sign-in for the wrong password with the same generic message", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "editor@test.local",
      passwordHash: knownPasswordHash,
      status: "ACTIVE",
    });

    await expect(auth.signIn("editor@test.local", "wrong password")).rejects.toThrow(
      new UnauthorizedError("Invalid email or password"),
    );
    expect(mockedPrisma.session.create).not.toHaveBeenCalled();
  });

  it("issues a session on correct credentials, never returning the password hash", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "editor@test.local",
      displayName: "Editor One",
      role: "EDITOR",
      passwordHash: knownPasswordHash,
      status: "ACTIVE",
    });

    const result = await auth.signIn("editor@test.local", KNOWN_PASSWORD);

    expect(result.rawToken).toEqual(expect.any(String));
    expect(result.user).toEqual({
      id: "u1",
      email: "editor@test.local",
      displayName: "Editor One",
      role: "EDITOR",
    });
    expect(Object.keys(result.user)).not.toContain("passwordHash");
    expect(mockedPrisma.session.create).toHaveBeenCalledTimes(1);
  });

  it("refuses to set a password with an unknown or expired token", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await expect(auth.setPasswordWithToken("bogus-token", "a-new-password")).rejects.toThrow(
      UnauthorizedError,
    );
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("refuses an expired token even if it otherwise matches a user", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordResetTokenHash: "irrelevant-because-mocked-lookup",
      passwordResetExpiresAt: new Date(Date.now() - 1000),
    });

    await expect(auth.setPasswordWithToken("some-token", "a-new-password")).rejects.toThrow(
      UnauthorizedError,
    );
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });
});
