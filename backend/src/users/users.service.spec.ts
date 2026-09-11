jest.mock("../db", () => ({
  prisma: {
    user: { update: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock("../auth/auth.service", () => ({
  INVITATION_TOKEN_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  issueInvitationToken: jest.fn().mockResolvedValue("raw-token"),
}));
jest.mock("../mail", () => ({
  mailer: { kind: "console", send: jest.fn().mockResolvedValue(undefined) },
  appLink: (path: string, token: string) => `http://app.test${path}?token=${token}`,
  invitationEmail: jest.fn((input: { to: string }) => ({ to: input.to, subject: "s", text: "t", html: "h" })),
}));

import { prisma } from "../db";
import { mailer } from "../mail";
import * as usersService from "./users.service";
import { ConflictError, NotFoundError } from "../common/http-errors";

const mockedPrisma = prisma as unknown as {
  user: { update: jest.Mock; create: jest.Mock; findUnique: jest.Mock };
  $transaction: jest.Mock;
};
const mockedMailer = mailer as unknown as { kind: string; send: jest.Mock };
const admin = { displayName: "The Admin" };

const invitee = {
  id: "u-new",
  email: "new@example.com",
  displayName: "New Person",
  role: "EDITOR",
  status: "ACTIVE",
  passwordSetAt: null,
  createdAt: new Date("2026-09-11"),
};

describe("users.service — BR-14 error mapping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps the least-one-admin trigger's raw Postgres exception to a clean 409, never leaking it", async () => {
    mockedPrisma.user.update.mockRejectedValue(
      new Error("at least one active admin must exist at all times (BR-14)"),
    );

    await expect(usersService.changeRole("u1", "EDITOR")).rejects.toThrow(ConflictError);
  });

  it("maps the most-one-admin trigger's raw Postgres exception to a clean 409, never leaking it", async () => {
    mockedPrisma.user.update.mockRejectedValue(
      new Error("at most one active admin may exist at a time (BR-14)"),
    );

    await expect(usersService.changeRole("u1", "ADMIN")).rejects.toThrow(ConflictError);
  });

  it("invite() maps a second-admin attempt to a clean 409, never a raw 500", async () => {
    mockedPrisma.user.create.mockRejectedValue(
      new Error("at most one active admin may exist at a time (BR-14)"),
    );

    await expect(usersService.invite("second-admin@example.com", "Someone", "ADMIN", admin)).rejects.toThrow(
      ConflictError,
    );
  });

  it("leaves an unrelated database error untouched — not every failure is BR-14", async () => {
    const unrelated = new Error("connection reset by peer");
    mockedPrisma.user.update.mockRejectedValue(unrelated);

    await expect(usersService.changeRole("u1", "EDITOR")).rejects.toThrow(unrelated);
  });

  it("maps Prisma's not-found error (P2025) to NotFoundError", async () => {
    const notFound = Object.assign(new Error("Record not found"), { code: "P2025" });
    mockedPrisma.user.update.mockRejectedValue(notFound);

    await expect(usersService.changeRole("missing", "EDITOR")).rejects.toThrow(NotFoundError);
  });

  it("deactivate() runs updates inside a transaction and maps BR-14 the same way", async () => {
    mockedPrisma.$transaction.mockRejectedValue(
      new Error("at least one active admin must exist at all times (BR-14)"),
    );

    await expect(usersService.deactivate("u1")).rejects.toThrow(ConflictError);
  });

  it("invite() maps a duplicate email (P2002) to a clean 409, never a raw 500", async () => {
    const duplicateEmail = Object.assign(new Error("Unique constraint failed on the fields: (`email`)"), {
      code: "P2002",
    });
    mockedPrisma.user.create.mockRejectedValue(duplicateEmail);

    await expect(usersService.invite("taken@example.com", "Someone", "EDITOR", admin)).rejects.toThrow(ConflictError);
  });
});

describe("users.service — invitation delivery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedMailer.kind = "console";
    mockedMailer.send.mockResolvedValue(undefined);
  });

  it("emails the invitation and reports delivery; echoes the link only on the console transport", async () => {
    mockedPrisma.user.create.mockResolvedValue(invitee);

    const result = await usersService.invite(invitee.email, invitee.displayName, "EDITOR", admin);

    expect(mockedMailer.send).toHaveBeenCalledTimes(1);
    expect(result.emailDelivered).toBe(true);
    expect(result.invitationLink).toBe("http://app.test/staff/accept-invitation?token=raw-token");
    expect(result.user.invitationPending).toBe(true);
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("never echoes the link when the transport is SMTP", async () => {
    mockedPrisma.user.create.mockResolvedValue(invitee);
    mockedMailer.kind = "smtp";

    const result = await usersService.invite(invitee.email, invitee.displayName, "EDITOR", admin);

    expect(result.invitationLink).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("raw-token");
  });

  it("still creates the account when the email fails, and says so", async () => {
    mockedPrisma.user.create.mockResolvedValue(invitee);
    mockedMailer.send.mockRejectedValue(new Error("SMTP 550"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await usersService.invite(invitee.email, invitee.displayName, "EDITOR", admin);

    expect(result.emailDelivered).toBe(false);
    expect(result.user.id).toBe("u-new");
    errorSpy.mockRestore();
  });

  it("resendInvitation re-sends for someone who has never set a password", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(invitee);

    const result = await usersService.resendInvitation("u-new", admin);

    expect(mockedMailer.send).toHaveBeenCalledTimes(1);
    expect(result.emailDelivered).toBe(true);
  });

  it("resendInvitation refuses once a password has been set — that is forgot-password's job", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ ...invitee, passwordSetAt: new Date() });

    await expect(usersService.resendInvitation("u-new", admin)).rejects.toThrow(ConflictError);
    expect(mockedMailer.send).not.toHaveBeenCalled();
  });

  it("resendInvitation refuses a deactivated account and 404s an unknown one", async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ ...invitee, status: "DEACTIVATED" });
    await expect(usersService.resendInvitation("u-new", admin)).rejects.toThrow(ConflictError);
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(usersService.resendInvitation("missing", admin)).rejects.toThrow(NotFoundError);
  });
});
