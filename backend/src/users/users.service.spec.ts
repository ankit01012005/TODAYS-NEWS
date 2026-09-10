jest.mock("../db", () => ({
  prisma: {
    user: { update: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock("../auth/auth.service", () => ({
  issueInvitationToken: jest.fn(),
}));

import { prisma } from "../db";
import * as usersService from "./users.service";
import { ConflictError, NotFoundError } from "../common/http-errors";

const mockedPrisma = prisma as unknown as {
  user: { update: jest.Mock; create: jest.Mock };
  $transaction: jest.Mock;
};

describe("users.service — BR-14 error mapping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps the BR-14 trigger's raw Postgres exception to a clean 409, never leaking it", async () => {
    mockedPrisma.user.update.mockRejectedValue(
      new Error("at least one active admin must exist at all times (BR-14)"),
    );

    await expect(usersService.changeRole("u1", "EDITOR")).rejects.toThrow(ConflictError);
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

    await expect(usersService.invite("taken@example.com", "Someone", "EDITOR")).rejects.toThrow(ConflictError);
  });
});
