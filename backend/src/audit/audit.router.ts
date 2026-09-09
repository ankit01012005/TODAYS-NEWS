import { Router, Request, Response } from "express";
import * as auditService from "./audit.service";
import { requireUuidParam } from "../common/middleware/uuid-param.middleware";
import { requireCapability } from "../common/middleware/require-capability.middleware";
import { CurrentUser } from "../common/current-user";

/// Mounted bare (full paths) in app.ts, like articlesRouter.
export const auditRouter = Router();

/// Global feed — admin only (audit:view).
auditRouter.get("/audit", requireCapability("audit:view"), async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  res.status(200).json(await auditService.listAudit({ limit, offset }));
});

/// Per-article — owner or admin (docs/11 §6), not capability-gated.
auditRouter.get(
  "/articles/:id/audit",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await auditService.listAuditForArticle(CurrentUser(req), req.params.id));
  },
);
