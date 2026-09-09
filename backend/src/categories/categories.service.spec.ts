jest.mock("../db", () => ({
  prisma: { category: { update: jest.fn() } },
}));

import { prisma } from "../db";
import * as categoriesService from "./categories.service";
import { ConflictError, NotFoundError } from "../common/http-errors";

const mockedPrisma = prisma as unknown as { category: { update: jest.Mock } };

describe("categories.service — P2-21 error mapping", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps the P2-21 trigger's raw Postgres exception to a clean 409, never leaking it", async () => {
    mockedPrisma.category.update.mockRejectedValue(
      new Error("category cannot be deactivated while a published article references it (P2-21)"),
    );
    await expect(categoriesService.deactivateCategory("c1")).rejects.toThrow(ConflictError);
  });

  it("maps a not-found category to NotFoundError", async () => {
    const notFound = Object.assign(new Error("Record not found"), { code: "P2025" });
    mockedPrisma.category.update.mockRejectedValue(notFound);
    await expect(categoriesService.deactivateCategory("missing")).rejects.toThrow(NotFoundError);
  });

  it("leaves an unrelated error untouched", async () => {
    const unrelated = new Error("connection reset");
    mockedPrisma.category.update.mockRejectedValue(unrelated);
    await expect(categoriesService.deactivateCategory("c1")).rejects.toThrow(unrelated);
  });
});
