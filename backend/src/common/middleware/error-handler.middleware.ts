import { NextFunction, Request, Response } from "express";
import { HttpError } from "../http-errors";

/// Express's four-argument error middleware — must be registered LAST
/// (app.ts). Maps every error to the vocabulary in docs/12 §0: a plain
/// message, never a stack trace or a raw database error (SEC-06). Express 5
/// forwards rejected promises from async handlers here automatically, so
/// route handlers never need a try/catch or a wrapper just to get here.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      correlationId: req.id,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(`Unhandled exception on ${req.method} ${req.originalUrl} [${req.id}]`, err);
  res.status(500).json({
    statusCode: 500,
    correlationId: req.id,
    message: "Something went wrong on our side. Please try again.",
  });
}
