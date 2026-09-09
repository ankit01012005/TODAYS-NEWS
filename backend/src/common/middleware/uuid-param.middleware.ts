import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../http-errors";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/// The Express equivalent of Nest's ParseUUIDPipe on a route param — a
/// clean 400 for a malformed id instead of an obscure database error
/// (SEC-06 — input validation, not just DTO bodies).
export function requireUuidParam(name: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.params[name];
    if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
      throw new BadRequestError(`"${name}" must be a valid UUID`);
    }
    next();
  };
}
