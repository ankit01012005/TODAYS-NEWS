import { NextFunction, Request, Response } from "express";
import { Capability, roleHasCapability } from "../capabilities";
import { ForbiddenError } from "../http-errors";

/// Applied per-route/router, after sessionAuth has already run. This is the
/// CAPABILITY check only (docs/23 §12.1) — ownership and state legality are
/// the service layer's job, not this middleware's, so a missing ownership
/// check can never hide behind "the middleware already checked it".
export function requireCapability(capability: Capability) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roleHasCapability(req.user.role, capability)) {
      throw new ForbiddenError(`Missing required capability: ${capability}`);
    }
    next();
  };
}
