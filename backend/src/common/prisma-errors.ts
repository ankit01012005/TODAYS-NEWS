import { Prisma } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  HttpError,
  NotFoundError,
  ServiceUnavailableError,
} from "./http-errors";

/// One place that decides what a database failure means to a caller.
///
/// Services already translate the codes they expect into domain language
/// ("A category with that address already exists") and should keep doing
/// so — this is the safety net for everything they did not anticipate, and
/// it runs in the error handler on the way out.
///
/// The failure it exists for: an unreachable database used to surface as a
/// flat 500 "Something went wrong on our side", indistinguishable from a
/// genuine bug. A reader retrying would have succeeded; the on-call alert
/// said "application error" when the truth was "Postgres is unreachable".
/// Connection-class failures are 503 + Retry-After, which is both honest
/// and actionable.

/// Prisma's connection and engine-lifecycle codes (P1xxx) plus the two
/// transaction codes that mean "the database was too busy or too slow",
/// not "the request was wrong".
const UNAVAILABLE_CODES = new Set([
  "P1000", // authentication failed — the database is there, we cannot use it
  "P1001", // cannot reach the database server
  "P1002", // connection timed out
  "P1008", // operation timed out
  "P1010", // access denied
  "P1011", // TLS error
  "P1017", // server closed the connection
  "P2024", // timed out fetching a connection from the pool
  "P2028", // transaction API error (our interactive transactions)
  "P2034", // write conflict / deadlock — a retry is the right response
]);

/// Returns an HttpError for anything database-shaped, or null when the
/// error is not Prisma's — the caller then treats it as a genuine 500.
export function toHttpError(error: unknown): HttpError | null {
  if (error instanceof HttpError) return error;

  // The engine could not start or could not connect at all: no query ever
  // ran, so nothing was written and a retry is safe.
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return new ServiceUnavailableError();
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (UNAVAILABLE_CODES.has(error.code)) {
      return new ServiceUnavailableError();
    }
    switch (error.code) {
      case "P2002":
        // A unique constraint the service did not expect. The field names
        // are safe to surface (they are our own schema, not user data) and
        // turn an opaque 409 into something an editor can act on.
        return new ConflictError(
          `That ${describeTarget(error)} is already taken. Please choose another.`,
        );
      case "P2025":
        return new NotFoundError("That record no longer exists.");
      case "P2003":
        return new BadRequestError("That change refers to a record that does not exist.");
      case "P2014":
        return new ConflictError("That change would break a record this one depends on.");
      default:
        return null;
    }
  }

  // A malformed query is our bug, not the caller's — a 500 is correct, and
  // returning null lets the handler log it with its stack.
  return null;
}

/// P2002 puts the offending columns in `meta.target`, as an array on
/// PostgreSQL. Rendered as ordinary words, never the raw column name.
function describeTarget(error: Prisma.PrismaClientKnownRequestError): string {
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : typeof target === "string" ? [target] : [];
  if (fields.length === 0) return "value";
  return fields.map((field) => field.replace(/_/g, " ")).join(" and ");
}

/// True for the failures where retrying the same request could succeed —
/// used by the error handler to decide whether to send Retry-After.
export function isTransient(error: unknown): boolean {
  return toHttpError(error) instanceof ServiceUnavailableError;
}
