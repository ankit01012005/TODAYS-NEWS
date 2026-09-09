/// Typed errors the error-handling middleware (error-handler.middleware.ts)
/// knows how to map to a status code and a safe, structured response body —
/// the Express equivalent of Nest's HttpException hierarchy. Route handlers
/// and services throw these; nothing else should ever reach a client
/// (SEC-06 — no raw error, no stack trace).
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}
