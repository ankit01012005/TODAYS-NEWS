import { Prisma } from "@prisma/client";
import { toHttpError, isTransient } from "./prisma-errors";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, ServiceUnavailableError } from "./http-errors";

function knownError(code: string, meta?: Record<string, unknown>): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("db said no", {
    code,
    clientVersion: "6.19.3",
    meta,
  });
}

describe("toHttpError", () => {
  it("maps an unreachable database to 503, not 500 — the request was fine", () => {
    const initFailure = new Prisma.PrismaClientInitializationError(
      "Can't reach database server",
      "6.19.3",
      "P1001",
    );

    const mapped = toHttpError(initFailure);
    expect(mapped).toBeInstanceOf(ServiceUnavailableError);
    expect(mapped?.statusCode).toBe(503);
    expect(isTransient(initFailure)).toBe(true);
  });

  it("treats pool exhaustion, transaction and deadlock failures as retryable", () => {
    for (const code of ["P1001", "P1002", "P1008", "P1017", "P2024", "P2028", "P2034"]) {
      expect(toHttpError(knownError(code))?.statusCode).toBe(503);
    }
  });

  it("maps a unique-constraint violation to 409 and names the field in plain words", () => {
    const mapped = toHttpError(knownError("P2002", { target: ["storage_key"] }));

    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.message).toContain("storage key");
    // Never the raw Prisma text or the SQL.
    expect(mapped?.message).not.toContain("db said no");
  });

  it("maps a missing record to 404 and a broken reference to 400", () => {
    expect(toHttpError(knownError("P2025"))).toBeInstanceOf(NotFoundError);
    expect(toHttpError(knownError("P2003"))).toBeInstanceOf(BadRequestError);
  });

  it("returns null for anything it does not recognise, so it stays a 500", () => {
    expect(toHttpError(new Error("null is not an object"))).toBeNull();
    expect(toHttpError(knownError("P2999"))).toBeNull();
    expect(isTransient(new Error("boom"))).toBe(false);
  });

  it("passes an HttpError through untouched — the service already decided", () => {
    const deliberate = new ForbiddenError("Only an admin may publish");
    expect(toHttpError(deliberate)).toBe(deliberate);
  });
});
