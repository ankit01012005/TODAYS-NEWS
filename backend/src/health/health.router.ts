import { Router, Request, Response } from "express";

/// Liveness check for rolling deploys (docs/23 §20.1). Deliberately does
/// not touch the database — a DB hiccup shouldn't make the orchestrator
/// think the process itself is dead. Mounted before sessionAuth — public.
export const healthRouter = Router();

healthRouter.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});
