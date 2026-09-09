import express, { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { requestId } from "./common/middleware/request-id.middleware";
import { sessionAuth } from "./common/middleware/session-auth.middleware";
import { errorHandler } from "./common/middleware/error-handler.middleware";
import { NotFoundError } from "./common/http-errors";
import { healthRouter } from "./health/health.router";
import { authPublicRouter, authProtectedRouter } from "./auth/auth.router";
import { usersRouter } from "./users/users.router";

/// Builds the Express app without starting a listener — main.ts calls
/// listen(), tests can exercise the app directly. Route registration order
/// IS the security boundary here (no decorator/metadata system, unlike the
/// NestJS version this replaced): anything mounted before sessionAuth is
/// public; everything after it is protected by default (SEC-01) — a new
/// router that forgets to opt out just gets protected, which is the safe
/// failure direction.
export function createApp(): Express {
  const app = express();

  app.use(requestId);
  app.use(cookieParser());
  app.use(express.json());
  // No frontend origin decided yet — permissive for now, tightened once a
  // frontend exists and talks to this API server-to-server (docs/23 §11.4).
  app.use(cors({ origin: true, credentials: true }));

  // --- Public routes ---
  app.use(healthRouter);
  app.use(authPublicRouter);

  // --- Everything below requires a session ---
  app.use(sessionAuth);
  app.use(authProtectedRouter);
  app.use(usersRouter);

  // Unmatched route -> our JSON 404, not Express's default HTML page.
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError("Not found"));
  });

  // Must be registered last.
  app.use(errorHandler);

  return app;
}
