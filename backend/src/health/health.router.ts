import { Router, Request, Response } from "express";
import { prisma } from "../db";

/// Mounted before sessionAuth — public.
///
/// /health — liveness for rolling deploys (docs/23 §20.1). Deliberately
/// does not touch the database — a DB hiccup shouldn't make the
/// orchestrator think the process itself is dead and restart it.
///
/// /ready — readiness: the process can actually serve, i.e. it can reach
/// its database. A load balancer should route traffic only while this is
/// 200; it returns 503 (not 500) so it is never confused with a bug.
export const healthRouter = Router();

healthRouter.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

healthRouter.get("/ready", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});
