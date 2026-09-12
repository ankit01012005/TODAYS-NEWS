import { Router, Request, Response } from "express";
import * as transitions from "./transition.service";
import { prisma } from "../db";
import { VersionDto } from "./dto/version.dto";
import { RequestChangesDto } from "./dto/request-changes.dto";
import { RejectDto } from "./dto/reject.dto";
import { UnpublishDto } from "./dto/unpublish.dto";
import { validateBody } from "../common/middleware/validate-body.middleware";
import { requireUuidParam } from "../common/middleware/uuid-param.middleware";
import { requireCapability } from "../common/middleware/require-capability.middleware";
import { CurrentUser } from "../common/current-user";
import { toArticleDetailView, toRevisionView, toReviewQueueEntryView } from "./article.view";

/// The workflow transitions themselves (docs/23 §8.3: REVIEWS — "the most
/// security-sensitive domain"). Deliberately separate from articlesRouter:
/// the code that changes a headline can never accidentally be the code that
/// publishes. Mounted in app.ts after sessionAuth.
export const reviewsRouter = Router();

reviewsRouter.post(
  "/articles/:id/submit",
  requireUuidParam("id"),
  requireCapability("article:submit"),
  validateBody(VersionDto),
  async (req: Request<{ id: string }, unknown, VersionDto>, res: Response) => {
    const revision = await transitions.submitForReview(CurrentUser(req), req.params.id, req.body.version);
    res.status(200).json(toRevisionView(revision));
  },
);

reviewsRouter.post(
  "/articles/:id/withdraw",
  requireUuidParam("id"),
  requireCapability("article:withdraw"),
  validateBody(VersionDto),
  async (req: Request<{ id: string }, unknown, VersionDto>, res: Response) => {
    const revision = await transitions.withdraw(CurrentUser(req), req.params.id, req.body.version);
    res.status(200).json(toRevisionView(revision));
  },
);

reviewsRouter.post(
  "/articles/:id/request-changes",
  requireUuidParam("id"),
  requireCapability("review:request-changes"),
  validateBody(RequestChangesDto),
  async (req: Request<{ id: string }, unknown, RequestChangesDto>, res: Response) => {
    const revision = await transitions.requestChanges(
      CurrentUser(req),
      req.params.id,
      req.body.version,
      req.body.comment,
    );
    res.status(200).json(toRevisionView(revision));
  },
);

reviewsRouter.post(
  "/articles/:id/reject",
  requireUuidParam("id"),
  requireCapability("review:reject"),
  validateBody(RejectDto),
  async (req: Request<{ id: string }, unknown, RejectDto>, res: Response) => {
    const revision = await transitions.reject(CurrentUser(req), req.params.id, req.body.version, req.body.reason);
    res.status(200).json(toRevisionView(revision));
  },
);

/// T5 + T10 combined — "Approve & Publish" (P2-24).
reviewsRouter.post(
  "/articles/:id/approve",
  requireUuidParam("id"),
  requireCapability("review:approve"),
  validateBody(VersionDto),
  async (req: Request<{ id: string }, unknown, VersionDto>, res: Response) => {
    const { article, revision } = await transitions.approveAndPublish(
      CurrentUser(req),
      req.params.id,
      req.body.version,
    );
    res.status(200).json(toArticleDetailView(article, null, revision));
  },
);

reviewsRouter.post(
  "/articles/:id/unpublish",
  requireUuidParam("id"),
  requireCapability("review:unpublish"),
  validateBody(UnpublishDto),
  async (req: Request<{ id: string }, unknown, UnpublishDto>, res: Response) => {
    const article = await transitions.unpublish(CurrentUser(req), req.params.id, req.body.version, req.body.reason);
    res.status(200).json(article);
  },
);

reviewsRouter.post(
  "/articles/:id/correct",
  requireUuidParam("id"),
  requireCapability("article:correct"),
  async (req: Request<{ id: string }>, res: Response) => {
    const revision = await transitions.startCorrection(CurrentUser(req), req.params.id);
    res.status(201).json(toRevisionView(revision));
  },
);

reviewsRouter.post(
  "/articles/:id/reopen",
  requireUuidParam("id"),
  requireCapability("review:reopen"),
  async (req: Request<{ id: string }>, res: Response) => {
    const revision = await transitions.reopen(CurrentUser(req), req.params.id);
    res.status(201).json(toRevisionView(revision));
  },
);

reviewsRouter.post(
  "/articles/:id/archive",
  requireUuidParam("id"),
  requireCapability("review:archive"),
  validateBody(VersionDto),
  async (req: Request<{ id: string }, unknown, VersionDto>, res: Response) => {
    const revision = await transitions.archiveRejected(CurrentUser(req), req.params.id, req.body.version);
    res.status(200).json(toRevisionView(revision));
  },
);

reviewsRouter.post(
  "/articles/:id/restore",
  requireUuidParam("id"),
  requireCapability("review:restore"),
  async (req: Request<{ id: string }>, res: Response) => {
    const revision = await transitions.restore(CurrentUser(req), req.params.id);
    res.status(201).json(toRevisionView(revision));
  },
);

/// docs/23 Flow 5 — the admin review queue, oldest first (docs/10 §2: "the
/// most useful number on the page" is how long a story has waited).
reviewsRouter.get("/admin/review-queue", requireCapability("review:approve"), async (_req: Request, res: Response) => {
  const queue = await prisma.articleRevision.findMany({
    where: { state: "IN_REVIEW" },
    orderBy: { submittedAt: "asc" },
    include: {
      // The section shown is the one THIS revision proposes (docs/27 A1)
      // — what approving it would publish — not the article's current one.
      category: { select: { id: true, name: true, slug: true } },
      article: {
        select: {
          id: true,
          slug: true,
          ownerId: true,
          owner: { select: { displayName: true } },
        },
      },
    },
  });

  // "Sent back before" (docs/10 A-03: "a third-round story deserves a
  // closer look") — more than one revision ever created for the article
  // means this isn't its first time through review. Batched, not per-row.
  const revisionCounts = await prisma.articleRevision.groupBy({
    by: ["articleId"],
    where: { articleId: { in: queue.map((r) => r.articleId) } },
    _count: { _all: true },
  });
  const countByArticleId = new Map(revisionCounts.map((c) => [c.articleId, c._count._all]));

  res.status(200).json(
    queue.map((revision) => toReviewQueueEntryView(revision, (countByArticleId.get(revision.articleId) ?? 1) > 1)),
  );
});
