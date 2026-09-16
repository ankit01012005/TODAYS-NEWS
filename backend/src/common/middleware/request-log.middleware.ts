import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";

/// One structured line per request, on finish: method, path (never the
/// query string — it could carry a reset token), status, duration and the
/// correlation id so a log line and a user's error report can be joined.
/// Health probes are skipped so they don't drown everything else. Bodies,
/// cookies and headers are never logged (SEC-06).
///
/// `close` as well as `finish`: a client that disconnects mid-response
/// (a reader navigating away from a slow page, a load balancer timing out)
/// never fires `finish`, so those requests used to vanish from the log
/// entirely — exactly the ones worth seeing when latency is the problem.
export function requestLog(req: Request, res: Response, next: NextFunction): void {
  if (req.path === "/health" || req.path === "/ready") {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();
  let logged = false;

  const record = (aborted: boolean): void => {
    if (logged) return;
    logged = true;

    const ms = Math.round((Number(process.hrtime.bigint() - startedAt) / 1_000_000) * 10) / 10;
    const level = aborted ? "warn" : res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]("request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms,
      requestId: req.id,
      userId: req.user?.id,
      ...(aborted ? { aborted: true } : {}),
    });
  };

  res.on("finish", () => record(false));
  res.on("close", () => record(!res.writableEnded));

  next();
}
