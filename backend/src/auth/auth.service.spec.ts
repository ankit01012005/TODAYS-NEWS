import * as argon2 from "argon2";

jest.mock("../db", () => ({
  prisma: {
    user: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
    session: { create: jest.fn(), updateMany: jest.fn() },
  },
}));
jest.mock("../config", () => ({
  config: { SESSION_TTL_HOURS: 1, SESSION_COOKIE_NAME: "today_news_session", NODE_ENV: "test" },
}));

// Imported AFTER the mocks above so auth.service picks up the mocked modules.
import { prisma } from "../db";
import * as auth from "./auth.service";
import { BadRequestError, UnauthorizedError } from "../common/http-errors";

const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock; findUniqueOrThrow: jest.Mock; update: jest.Mock };
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

  describe("updateProfile — docs/09 E-10", () => {
    it("updates displayName alone, with no password fields at all", async () => {
      mockedPrisma.user.update.mockResolvedValue({
        id: "u1",
        email: "editor@test.local",
        displayName: "New Name",
        role: "EDITOR",
      });

      const result = await auth.updateProfile("u1", { displayName: "New Name" });

      expect(result.displayName).toBe("New Name");
      expect(mockedPrisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { displayName: "New Name" },
      });
    });

    it("refuses a new password with no current password supplied", async () => {
      await expect(auth.updateProfile("u1", { newPassword: "a new password 123" })).rejects.toThrow(
        BadRequestError,
      );
      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    });

    it("refuses a new password when the current password is wrong", async () => {
      mockedPrisma.user.findUniqueOrThrow.mockResolvedValue({ id: "u1", passwordHash: knownPasswordHash });

      await expect(
        auth.updateProfile("u1", { currentPassword: "wrong password", newPassword: "a new password 123" }),
      ).rejects.toThrow(UnauthorizedError);
      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    });

    it("sets a new password once the current one is verified", async () => {
      mockedPrisma.user.findUniqueOrThrow.mockResolvedValue({ id: "u1", passwordHash: knownPasswordHash });
      mockedPrisma.user.update.mockResolvedValue({
        id: "u1",
        email: "editor@test.local",
        displayName: "Editor One",
        role: "EDITOR",
      });

      await auth.updateProfile("u1", { currentPassword: KNOWN_PASSWORD, newPassword: "a new password 123" });

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { passwordHash: expect.any(String) },
      });
    });
  });
});
