import express, { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { requestId } from "./common/middleware/request-id.middleware";
import { requestLog } from "./common/middleware/request-log.middleware";
import { securityHeaders } from "./common/middleware/security-headers.middleware";
import { sessionAuth } from "./common/middleware/session-auth.middleware";
import { errorHandler } from "./common/middleware/error-handler.middleware";
import { NotFoundError } from "./common/http-errors";
import { config } from "./config";
import { healthRouter } from "./health/health.router";
import { authPublicRouter, authProtectedRouter } from "./auth/auth.router";
import { usersRouter } from "./users/users.router";
import { articlesRouter } from "./articles/articles.router";
import { reviewsRouter } from "./articles/reviews.router";
import { categoriesRouter } from "./categories/categories.router";
import { sourcesRouter, articleSourcesRouter } from "./sources/sources.router";
import { mediaRouter } from "./media/media.router";
import { auditRouter } from "./audit/audit.router";
import { publicRouter } from "./public/public.router";
import { socialPublicRouter, socialRouter } from "./social/social.router";
import { UPLOADS_DIR } from "./media/storage";

/// Builds the Express app without starting a listener — main.ts calls
/// listen(), tests can exercise the app directly. Route registration order
/// IS the security boundary here (no decorator/metadata system, unlike the
/// NestJS version this replaced): anything mounted before sessionAuth is
/// public; everything after it is protected by default (SEC-01) — a new
/// router that forgets to opt out just gets protected, which is the safe
/// failure direction.
export function createApp(): Express {
  const app = express();

  // Only when the process sits behind a reverse proxy/load balancer that
  // sets X-Forwarded-*: otherwise anyone could spoof their IP to the rate
  // limiter and the logs.
  if (config.TRUST_PROXY) {
    app.set("trust proxy", config.TRUST_PROXY);
  }
  app.disable("x-powered-by");

  app.use(requestId);
  app.use(securityHeaders);
  app.use(requestLog);
  app.use(cookieParser());
  // 512kb: a very long structured article body is tens of kb; this leaves
  // headroom without accepting arbitrarily large JSON.
  app.use(express.json({ limit: "512kb" }));

  // The browser never talks to this API directly (docs/23 §11.4) — every
  // call comes server-to-server from the Next.js app — so no cross-origin
  // access is granted unless CORS_ORIGINS explicitly lists origins. Never a
  // reflected `origin: true` with credentials: that would let any site the
  // reader visits make credentialed requests here.
  if (config.CORS_ORIGINS.length > 0) {
    app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));
  }

  // --- Public routes ---
  app.use(healthRouter);
  app.use(authPublicRouter);
  app.use(publicRouter);
  app.use(socialPublicRouter);
  // Uploaded media (local-disk placeholder, docs/23 §14.1) — served
  // publicly, same as any CDN-fronted object-storage bucket would be.
  app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "7d", immutable: true, index: false }));
  // express.static calls next() rather than responding when a file isn't
  // found, which would otherwise fall through into sessionAuth below and
  // turn a missing image into a confusing 401 instead of a plain 404.
  app.use("/uploads", (_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError("No such file"));
  });

  // --- Everything below requires a session ---
  app.use(sessionAuth);
  app.use(authProtectedRouter);
  app.use("/users", usersRouter);
  app.use("/categories", categoriesRouter);
  app.use("/sources", sourcesRouter);
  app.use(articleSourcesRouter);
  app.use("/media", mediaRouter);
  app.use("/social-picks", socialRouter);
  app.use(articlesRouter);
  app.use(reviewsRouter);
  app.use(auditRouter);

  // Unmatched route -> our JSON 404, not Express's default HTML page.
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError("Not found"));
  });

  // Must be registered last.
  app.use(errorHandler);

  return app;
}
