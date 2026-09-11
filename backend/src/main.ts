import "reflect-metadata";
import "./common/authenticated-user"; // Express.Request augmentation
import { createApp } from "./app";
import { config } from "./config";
import { disconnectDb } from "./db";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

const server = app.listen(config.PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Today_news API listening on port ${config.PORT}`);
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
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ time: new Date().toISOString(), level: "info", event: "shutdown", signal }));

  const forced = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error("Shutdown deadline reached; exiting with open connections");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forced.unref();

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDb();
  clearTimeout(forced);
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// A rejected promise nobody awaited is a bug, not a request failure — log
// it with the same shape as everything else and keep serving; the error
// handler already turns per-request failures into clean 500s.
process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ time: new Date().toISOString(), level: "error", event: "unhandledRejection" }), reason);
});
