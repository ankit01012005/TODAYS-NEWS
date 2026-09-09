import { NextFunction, Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { BadRequestError } from "../http-errors";

/// The Express equivalent of Nest's global ValidationPipe({ whitelist: true,
/// forbidNonWhitelisted: true, transform: true }). SEC-06: reject anything a
/// DTO doesn't declare, and coerce/validate the rest — front-end validation
/// is a courtesy, this is the rule. docs/12 §0's "Validation error" state:
/// say what is wrong, one entry per field.
export function validateBody<T extends object>(DtoClass: new () => T) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(DtoClass, req.body, {
      excludeExtraneousValues: false,
    });
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      throw new BadRequestError("Validation failed", formatErrors(errors));
    }

    req.body = instance;
    next();
  };
}

function formatErrors(errors: ValidationError[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const error of errors) {
    if (error.constraints) {
      result[error.property] = Object.values(error.constraints);
    }
  }
  return result;
}
