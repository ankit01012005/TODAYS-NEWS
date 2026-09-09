import "reflect-metadata";
import "./common/authenticated-user"; // Express.Request augmentation
import { createApp } from "./app";
import { config } from "./config";
import { disconnectDb } from "./db";

const app = createApp();

const server = app.listen(config.PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Today_news API listening on port ${config.PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`${signal} received, shutting down`);
  server.close();
  await disconnectDb();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
