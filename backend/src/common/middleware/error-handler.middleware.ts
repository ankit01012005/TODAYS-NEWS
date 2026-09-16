import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { HttpError, ServiceUnavailableError } from "../http-errors";
import { toHttpError } from "../prisma-errors";
import { logger } from "../logger";

/// Express's four-argument error middleware — must be registered LAST
/// (app.ts). Maps every error to the vocabulary in docs/12 §0: a plain
/// message, never a stack trace or a raw database error (SEC-06). Express 5
/// forwards rejected promises from async handlers here automatically, so
/// route handlers never need a try/catch or a wrapper just to get here.
///
/// Three outcomes, and the difference between them is the point:
///   4xx — the caller's request. Logged at warn, no stack, nobody paged.
///   503 — ours, but temporary (database unreachable, pool exhausted).
///         Carries Retry-After; the client may retry the same request.
///   500 — ours, and a bug. Logged at error with the full exception.
/// Before this split, a database outage and a null-pointer bug produced
/// byte-identical responses and log lines.
const RETRY_AFTER_SECONDS = "5";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Express sends the response itself once headers are out; trying again
  // throws ERR_HTTP_HEADERS_SENT and masks the original failure.
  if (res.headersSent) {
    logger.error("request.failed_after_response", { requestId: req.id, method: req.method, path: req.path, err });
    res.end();
    return;
  }

  const mapped = resolve(err);

  const body: Record<string, unknown> = {
    statusCode: mapped.statusCode,
    correlationId: req.id,
    message: mapped.message,
  };
  if (mapped.details !== undefined) body.details = mapped.details;

  if (mapped instanceof ServiceUnavailableError) {
    res.setHeader("Retry-After", RETRY_AFTER_SECONDS);
  }

  logUnlessRoutine(mapped, err, req);
  res.status(mapped.statusCode).json(body);
}

function resolve(err: unknown): HttpError {
  if (err instanceof MulterError) {
    // Multer's own message ("File too large") is already caller-facing.
    return new HttpError(400, `Upload rejected: ${err.message}`);
  }
  if (err instanceof HttpError) return err;

  const fromPrisma = toHttpError(err);
  if (fromPrisma) return fromPrisma;

  return new HttpError(500, "Something went wrong on our side. Please try again.");
}

/// A 404 on a mistyped URL and a 401 on an expired cookie are normal
/// traffic; the request log already records them with status and path.
/// Logging them again here would bury the lines that need attention.
function logUnlessRoutine(mapped: HttpError, original: unknown, req: Request): void {
  const context = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    status: mapped.statusCode,
    userId: req.user?.id,
  };

  if (mapped.statusCode >= 500) {
    logger.error(
      mapped instanceof ServiceUnavailableError ? "request.unavailable" : "request.unhandled",
      { ...context, err: original },
    );
    return;
  }
  // 4xx that the application raised deliberately: one warn line, no stack.
  // Useful for spotting a client that is looping on a 409.
  if (mapped.statusCode !== 401 && mapped.statusCode !== 404) {
    logger.warn("request.rejected", { ...context, reason: mapped.message });
  }
}
