import "reflect-metadata";
import "./common/authenticated-user"; // Express.Request augmentation
import { createApp } from "./app";
import { config } from "./config";
import { disconnectDb } from "./db";
import { verifyMailer } from "./mail";
import { logger } from "./common/logger";
import { startSessionReaper, stopSessionReaper } from "./common/session-reaper";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

const server = app.listen(config.PORT, "0.0.0.0", () => {
  logger.info("server.started", {
    port: config.PORT,
    env: config.NODE_ENV,
    mailTransport: config.MAIL_TRANSPORT,
    revalidation: config.REVALIDATE_SECRET ? "enabled" : "disabled",
  });
  void verifyMailer();
  startSessionReaper();
});

// Give a slow client a bounded time to finish; without these a stuck
// connection can hold a worker open through a deploy.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
server.requestTimeout = 30_000;

let shuttingDown = false;

/// Stop accepting connections, let in-flight requests finish (bounded),
/// then release the database pool. Exit code 0 on a clean drain, 1 if the
/// deadline forced it — so an orchestrator can tell the two apart.
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("server.shutdown", { signal });

  const forced = setTimeout(() => {
    logger.error("server.shutdown_forced", { signal, afterMs: SHUTDOWN_TIMEOUT_MS });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forced.unref();

  stopSessionReaper();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDb();
  clearTimeout(forced);
  logger.info("server.stopped", { signal });
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// A rejected promise nobody awaited is a bug, not a request failure — log
// it with the same shape as everything else and keep serving; the error
// handler already turns per-request failures into clean 500s.
process.on("unhandledRejection", (reason) => {
  logger.error("process.unhandledRejection", { err: reason });
});

// An uncaught exception is different: the stack that threw was abandoned
// part-way, so this process's in-memory state is no longer trustworthy.
// Log it, then drain and exit so the platform starts a clean one — the
// node default is to exit anyway, but silently and without draining.
process.on("uncaughtException", (error) => {
  logger.error("process.uncaughtException", { err: error });
  void shutdown("uncaughtException").then(() => process.exit(1));
});
