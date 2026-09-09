import { ConflictException, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";

describe("UsersService — BR-14 error mapping", () => {
  function makePrisma() {
    return {
      user: { update: jest.fn(), create: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn({
          user: { update: jest.fn() },
          session: { updateMany: jest.fn() },
        }),
      ),
    };
  }

  it("maps the BR-14 trigger's raw Postgres exception to a clean 409, never leaking it", async () => {
    const prisma = makePrisma();
    prisma.user.update.mockRejectedValue(
      new Error(
        'at least one active admin must exist at all times (BR-14)',
      ),
    );
    const service = new UsersService(prisma as never, {} as never);

    await expect(service.changeRole("u1", "EDITOR")).rejects.toThrow(ConflictException);
  });

  it("leaves an unrelated database error untouched — not every failure is BR-14", async () => {
    const prisma = makePrisma();
    const unrelated = new Error("connection reset by peer");
    prisma.user.update.mockRejectedValue(unrelated);
    const service = new UsersService(prisma as never, {} as never);

    await expect(service.changeRole("u1", "EDITOR")).rejects.toThrow(unrelated);
  });

  it("maps Prisma's not-found error (P2025) to NotFoundException", async () => {
    const prisma = makePrisma();
    const notFound = Object.assign(new Error("Record not found"), { code: "P2025" });
    prisma.user.update.mockRejectedValue(notFound);
    const service = new UsersService(prisma as never, {} as never);

    await expect(service.changeRole("missing", "EDITOR")).rejects.toThrow(NotFoundException);
  });
});
