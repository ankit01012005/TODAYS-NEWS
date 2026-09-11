import { NextFunction, Request, Response } from "express";

/// One structured line per request, on finish: method, path (never the
/// query string — it could carry a reset token), status, duration and the
/// correlation id so a log line and a user's error report can be joined.
/// Health probes are skipped so they don't drown everything else. Bodies,
/// cookies and headers are never logged (SEC-06).
export function requestLog(req: Request, res: Response, next: NextFunction): void {
  if (req.path === "/health" || req.path === "/ready") {
    next();
    return;
  }
  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const line = {
      time: new Date().toISOString(),
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Math.round(ms * 10) / 10,
      requestId: req.id,
      userId: req.user?.id,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(line));
  });
  next();
}
