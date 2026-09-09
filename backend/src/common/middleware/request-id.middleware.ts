import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/// Express has no Fastify-style built-in request id, so this is the first
/// middleware in the chain (app.ts). Carried into logs and error responses
/// (docs/23 §8.4) so a user can quote it when reporting a problem.
export function requestId(req: Request, res: Response, next: NextFunction): void {
  req.id = randomUUID();
  res.setHeader("X-Correlation-Id", req.id);
  next();
}
