import * as argon2 from "argon2";

jest.mock("../db", () => ({
  prisma: {
    user: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    session: { create: jest.fn(), updateMany: jest.fn() },
  },
}));
jest.mock("../config", () => ({
  config: { SESSION_TTL_HOURS: 1, SESSION_COOKIE_NAME: "today_news_session", NODE_ENV: "test" },
}));
jest.mock("../mail", () => ({
  mailer: { kind: "console", send: jest.fn().mockResolvedValue(undefined) },
  appLink: (path: string, token: string) => `http://app.test${path}?token=${token}`,
  passwordResetEmail: jest.fn((input: { to: string; link: string }) => ({
    to: input.to,
    subject: "reset",
    text: input.link,
    html: input.link,
  })),
}));

// Imported AFTER the mocks above so auth.service picks up the mocked modules.
import { prisma } from "../db";
import { mailer } from "../mail";
import * as auth from "./auth.service";
import { BadRequestError, UnauthorizedError } from "../common/http-errors";

const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock; findUniqueOrThrow: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
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

  it("refuses an expired or already-spent token even if the lookup found a user — docs/27 A4", async () => {
    // The lookup finds the row, but the guarded UPDATE (hash still present
    // AND unexpired) matches nothing — the second of two racing requests,
    // or an expired link, both land here.
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1" });
    mockedPrisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(auth.setPasswordWithToken("some-token", "a-new-password")).rejects.toThrow(
      UnauthorizedError,
    );
    expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "u1",
          passwordResetExpiresAt: { gt: expect.any(Date) },
          status: "ACTIVE",
        }),
      }),
    );
    expect(mockedPrisma.session.updateMany).not.toHaveBeenCalled();
  });

  it("consumes the token in one conditional write and revokes every session — docs/27 A4", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1" });
    mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 });
    mockedPrisma.session.updateMany.mockResolvedValue({ count: 2 });

    await auth.setPasswordWithToken("some-token", "a-new-password-that-is-long");

    const write = mockedPrisma.user.updateMany.mock.calls[0][0];
    expect(write.data).toEqual(
      expect.objectContaining({ passwordResetTokenHash: null, passwordResetExpiresAt: null }),
    );
    expect(write.data.passwordHash).toEqual(expect.any(String));
    expect(mockedPrisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u1", revokedAt: null }),
        data: { revokedAt: expect.any(Date) },
      }),
    );
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
        data: { passwordHash: expect.any(String), passwordSetAt: expect.any(Date) },
      });
    });

    it("a password change revokes every OTHER session but keeps the caller's own — docs/27 A4", async () => {
      mockedPrisma.user.findUniqueOrThrow.mockResolvedValue({ id: "u1", passwordHash: knownPasswordHash });
      mockedPrisma.user.update.mockResolvedValue({ id: "u1", email: "e@test.local", displayName: "E", role: "EDITOR" });
      mockedPrisma.session.updateMany.mockResolvedValue({ count: 1 });

      await auth.updateProfile(
        "u1",
        { currentPassword: KNOWN_PASSWORD, newPassword: "a new password 123" },
        "raw-session-token-of-the-caller",
      );

      const where = mockedPrisma.session.updateMany.mock.calls[0][0].where;
      expect(where).toEqual(expect.objectContaining({ userId: "u1", revokedAt: null }));
      expect(where.NOT.tokenHash).toEqual(expect.any(String));
      expect(where.NOT.tokenHash).not.toBe("raw-session-token-of-the-caller");
    });

    it("a display-name-only change touches no sessions", async () => {
      mockedPrisma.user.update.mockResolvedValue({ id: "u1", email: "e@test.local", displayName: "N", role: "EDITOR" });

      await auth.updateProfile("u1", { displayName: "N" }, "raw-session-token");

      expect(mockedPrisma.session.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("requestPasswordReset — docs/23 §11.3", () => {
    const mockedMailer = mailer as unknown as { send: jest.Mock };

    beforeEach(() => {
      jest.clearAllMocks();
      mockedPrisma.user.update.mockResolvedValue({});
    });

    it("issues a token and emails the reset link to an active account", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "editor@test.local", status: "ACTIVE" });

      await auth.requestPasswordReset("editor@test.local");
      await new Promise((resolve) => setImmediate(resolve)); // the send is deliberately not awaited

      expect(mockedPrisma.user.update).toHaveBeenCalledTimes(1);
      expect(mockedMailer.send).toHaveBeenCalledTimes(1);
      const message = mockedMailer.send.mock.calls[0][0] as { to: string; text: string };
      expect(message.to).toBe("editor@test.local");
      expect(message.text).toMatch(/^http:\/\/app\.test\/staff\/reset-password\?token=[0-9a-f]{64}$/);
    });

    it("does nothing observable for an unknown or deactivated account", async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce(null);
      await auth.requestPasswordReset("nobody@test.local");
      mockedPrisma.user.findUnique.mockResolvedValueOnce({ id: "u2", email: "gone@test.local", status: "DEACTIVATED" });
      await auth.requestPasswordReset("gone@test.local");

      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
      expect(mockedMailer.send).not.toHaveBeenCalled();
    });

    it("swallows a delivery failure so the response can't reveal the account exists", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "editor@test.local", status: "ACTIVE" });
      mockedMailer.send.mockRejectedValueOnce(new Error("SMTP down"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      await expect(auth.requestPasswordReset("editor@test.local")).resolves.toBeUndefined();
      await new Promise((resolve) => setImmediate(resolve));
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
