import { Article, ArticleRevision, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { AuthenticatedUser } from "../common/authenticated-user";
import { BadRequestError, ConflictError, NotFoundError } from "../common/http-errors";
import { assertNotSelfApproval, assertOwnerOrAdmin } from "./authorization";
import { writeAudit } from "../common/audit";

type TxClient = Prisma.TransactionClient;

/// Every transition follows the same shape (docs/23 §5.3): load, check
/// capability (route middleware) + ownership + state legality, check
/// preconditions, check the caller's version (P2-23), write the change and
/// its audit row atomically, commit — or refuse cleanly.

async function loadArticleOr404(tx: TxClient, articleId: string): Promise<Article> {
  const article = await tx.article.findUnique({ where: { id: articleId } });
  if (!article || article.deletedAt) {
    throw new NotFoundError("No such article");
  }
  return article;
}

async function loadOpenRevisionOrThrow(tx: TxClient, articleId: string): Promise<ArticleRevision> {
  const revision = await tx.articleRevision.findFirst({ where: { articleId, openMarker: true } });
  if (!revision) {
    throw new ConflictError("This article has no open revision");
  }
  return revision;
}

function assertRevisionState(revision: ArticleRevision, allowed: ArticleRevision["state"][]): void {
  if (!allowed.includes(revision.state)) {
    throw new ConflictError(
      `This action isn't valid from state ${revision.state} (BR-10 — only the defined transitions are possible)`,
    );
  }
}

/// Optimistic concurrency (P2-23): the WHERE clause only matches if the
/// version is still what the caller last saw. version is auto-incremented
/// by a database trigger (Phase 4B) — this code never sets it.
async function updateRevisionGuarded(
  tx: TxClient,
  revisionId: string,
  expectedVersion: number,
  data: Prisma.ArticleRevisionUncheckedUpdateManyInput,
): Promise<void> {
  const result = await tx.articleRevision.updateMany({
    where: { id: revisionId, version: expectedVersion },
    data,
  });
  if (result.count === 0) {
    throw new ConflictError("This article has changed since you last loaded it. Please refresh and try again.");
  }
}

/// BR-09 — headline, summary and body must be present to leave DRAFT. The
/// database CHECK constraint (Phase 4B) enforces this too; this is the
/// fail-fast, tell-them-exactly-what's-missing version of the same rule
/// (docs/23 Flow 4).
function assertCompleteForSubmission(revision: ArticleRevision): void {
  const missing: string[] = [];
  if (!revision.headline?.trim()) missing.push("headline");
  if (!revision.summary?.trim()) missing.push("summary");
  if (!revision.body) missing.push("body");
  if (missing.length > 0) {
    throw new BadRequestError(`Cannot submit — missing: ${missing.join(", ")}`, { missing });
  }
}

/// T4/T11/T13/T14/T16 all create a new revision as a copy of an existing
/// one's content (docs/26 §1.4), rather than mutating a frozen revision
/// (I-6) — DRAFT for T13/T14/T16 (correct / reopen / restore),
/// CHANGES_REQUESTED for T4/T11 (request changes). The I-1 unique index is
/// the race guard if two callers try this at once — caught and remapped
/// below. Also carries the source revision's ArticleSource rows forward:
/// sources are per-revision by design (docs/26 §4.2 — a correction may
/// change what's cited), but a fresh copy with zero citations would be data
/// loss whenever nothing about the sourcing actually changed.
async function copyIntoNewRevision(
  tx: TxClient,
  source: ArticleRevision,
  createdByUserId: string,
  targetState: "DRAFT" | "CHANGES_REQUESTED",
): Promise<ArticleRevision> {
  let created: ArticleRevision;
  try {
    created = await tx.articleRevision.create({
      data: {
        articleId: source.articleId,
        state: targetState,
        createdByUserId,
        headline: source.headline,
        summary: source.summary,
        body: (source.body ?? undefined) as Prisma.InputJsonValue | undefined,
        bodyPlain: source.bodyPlain,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        featuredImageId: source.featuredImageId,
        featuredImageAlt: source.featuredImageAlt,
        featuredImageCredit: source.featuredImageCredit,
        featuredImageCaption: source.featuredImageCaption,
      },
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error, "article_revisions_article_id_open_marker_key")) {
      throw new ConflictError("This article already has an open revision (I-1)");
    }
    throw error;
  }

  const sources = await tx.articleSource.findMany({ where: { articleRevisionId: source.id } });
  if (sources.length > 0) {
    await tx.articleSource.createMany({
      data: sources.map((s) => ({
        articleRevisionId: created.id,
        sourceId: s.sourceId,
        position: s.position,
        isPublic: s.isPublic,
        note: s.note,
      })),
    });
  }

  return created;
}

function isUniqueConstraintViolation(error: unknown, constraintHint: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    JSON.stringify(error.meta ?? {}).includes(constraintHint)
  );
}

// ---------------------------------------------------------------------------
// T3 / T9 — submit / resubmit
// ---------------------------------------------------------------------------
export async function submitForReview(
  user: AuthenticatedUser,
  articleId: string,
  version: number,
): Promise<ArticleRevision> {
  return prisma.$transaction(async (tx) => {
    const article = await loadArticleOr404(tx, articleId);
    assertOwnerOrAdmin(user, article);
    const revision = await loadOpenRevisionOrThrow(tx, articleId);
    assertRevisionState(revision, ["DRAFT", "CHANGES_REQUESTED"]);
    assertCompleteForSubmission(revision);

    await updateRevisionGuarded(tx, revision.id, version, { state: "IN_REVIEW", submittedAt: new Date() });
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: revision.id,
      action: "SUBMIT",
      articleId,
    });
    return tx.articleRevision.findUniqueOrThrow({ where: { id: revision.id } });
  });
}

// ---------------------------------------------------------------------------
// T7 — withdraw (owner or admin, per docs/11's working assumption for OQ-04)
// ---------------------------------------------------------------------------
export async function withdraw(user: AuthenticatedUser, articleId: string, version: number): Promise<ArticleRevision> {
  return prisma.$transaction(async (tx) => {
    const article = await loadArticleOr404(tx, articleId);
    assertOwnerOrAdmin(user, article);
    const revision = await loadOpenRevisionOrThrow(tx, articleId);
    assertRevisionState(revision, ["IN_REVIEW"]);

    await updateRevisionGuarded(tx, revision.id, version, { state: "DRAFT" });
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: revision.id,
      action: "WITHDRAW",
      articleId,
    });
    return tx.articleRevision.findUniqueOrThrow({ where: { id: revision.id } });
  });
}

// ---------------------------------------------------------------------------
// T4 / T11 — request changes (admin only, from IN_REVIEW or APPROVED)
//
// docs/26 §1.4: the reviewed revision is ARCHIVED, and a NEW revision is
// created as a copy, CHANGES_REQUESTED, editable — not a same-row state
// flip. Reason: ADM-03 requires the admin to see what changed since last
// submission, and P2-16 asks whether an editor can see what an admin
// changed; both need the previously submitted text preserved exactly as it
// was reviewed. If the editor's later edits landed on the same row, the
// version the admin actually read would be gone. The ReviewDecision is
// written against the now-frozen ARCHIVED revision — "the version the admin
// actually reviewed" — and createdByUserId on the copy is preserved from
// the source (this is still the editor's writing, not new authorship by
// the admin who sent it back).
// ---------------------------------------------------------------------------
export async function requestChanges(
  user: AuthenticatedUser,
  articleId: string,
  version: number,
  comment: string,
): Promise<ArticleRevision> {
  return prisma.$transaction(async (tx) => {
    await loadArticleOr404(tx, articleId);
    const revision = await loadOpenRevisionOrThrow(tx, articleId);
    assertRevisionState(revision, ["IN_REVIEW", "APPROVED"]);

    await updateRevisionGuarded(tx, revision.id, version, { state: "ARCHIVED", archivedAt: new Date() });
    await tx.reviewDecision.create({
      data: {
        articleRevisionId: revision.id,
        decision: "CHANGES_REQUESTED",
        comment,
        decidedByUserId: user.id,
      },
    });

    const copy = await copyIntoNewRevision(tx, revision, revision.createdByUserId, "CHANGES_REQUESTED");

    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: copy.id,
      action: "REQUEST_CHANGES",
      articleId,
      metadata: { reviewedRevisionId: revision.id },
    });
    return copy;
  });
}

// ---------------------------------------------------------------------------
// T6 — reject (admin only, from IN_REVIEW)
// ---------------------------------------------------------------------------
export async function reject(
  user: AuthenticatedUser,
  articleId: string,
  version: number,
  reason: string,
): Promise<ArticleRevision> {
  return prisma.$transaction(async (tx) => {
    await loadArticleOr404(tx, articleId);
    const revision = await loadOpenRevisionOrThrow(tx, articleId);
    assertRevisionState(revision, ["IN_REVIEW"]);

    await updateRevisionGuarded(tx, revision.id, version, { state: "REJECTED" });
    await tx.reviewDecision.create({
      data: {
        articleRevisionId: revision.id,
        decision: "REJECTED",
        comment: reason,
        decidedByUserId: user.id,
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: revision.id,
      action: "REJECT",
      articleId,
    });
    return tx.articleRevision.findUniqueOrThrow({ where: { id: revision.id } });
  });
}

// ---------------------------------------------------------------------------
// T5 + T10 — approve and publish, combined into one admin action in V1
// (P2-24: APPROVED is never separately observed in V1; it stays in the enum
// for OQ-07 scheduling to use later without a rewrite).
// ---------------------------------------------------------------------------
export async function approveAndPublish(
  user: AuthenticatedUser,
  articleId: string,
  version: number,
): Promise<{ article: Article; revision: ArticleRevision }> {
  return prisma.$transaction(async (tx) => {
    const article = await loadArticleOr404(tx, articleId);
    const revision = await loadOpenRevisionOrThrow(tx, articleId);
    assertRevisionState(revision, ["IN_REVIEW"]);
    // BR-13 — checked here for a clean message; the Phase 4B database
    // triggers are the defense-in-depth backstop.
    assertNotSelfApproval(user, article, revision);

    await tx.reviewDecision.create({
      data: { articleRevisionId: revision.id, decision: "APPROVED", decidedByUserId: user.id },
    });

    // I-2 — a previously live revision must be archived before the new one
    // can become PUBLISHED (only one PUBLISHED revision per article).
    if (article.currentPublishedRevisionId) {
      await tx.articleRevision.update({
        where: { id: article.currentPublishedRevisionId },
        data: { state: "ARCHIVED", archivedAt: new Date() },
      });
    }

    const now = new Date();
    await updateRevisionGuarded(tx, revision.id, version, {
      state: "PUBLISHED",
      publishedAt: now,
      publishedByUserId: user.id,
    });

    const updatedArticle = await tx.article.update({
      where: { id: articleId },
      data: {
        publicationStatus: "LIVE",
        currentPublishedRevisionId: revision.id,
        firstPublishedAt: article.firstPublishedAt ?? now,
        publishedAt: now,
      },
    });

    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: revision.id,
      action: "APPROVE",
      articleId,
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: revision.id,
      action: "PUBLISH",
      articleId,
    });

    const updatedRevision = await tx.articleRevision.findUniqueOrThrow({ where: { id: revision.id } });
    return { article: updatedArticle, revision: updatedRevision };
  });
}

// ---------------------------------------------------------------------------
// T12 — unpublish (admin only)
// ---------------------------------------------------------------------------
export async function unpublish(
  user: AuthenticatedUser,
  articleId: string,
  version: number,
  reason: string,
): Promise<Article> {
  return prisma.$transaction(async (tx) => {
    const article = await loadArticleOr404(tx, articleId);
    if (!article.currentPublishedRevisionId) {
      throw new ConflictError("This article isn't currently published");
    }
    const revision = await tx.articleRevision.findUniqueOrThrow({
      where: { id: article.currentPublishedRevisionId },
    });

    await updateRevisionGuarded(tx, revision.id, version, { state: "ARCHIVED", archivedAt: new Date() });
    const updatedArticle = await tx.article.update({
      where: { id: articleId },
      data: { publicationStatus: "WITHDRAWN", currentPublishedRevisionId: null },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "Article",
      entityId: articleId,
      action: "UNPUBLISH",
      articleId,
      metadata: { reason },
    });
    return updatedArticle;
  });
}

// ---------------------------------------------------------------------------
// T13 — start a correction (owner or admin; live version stays untouched)
// ---------------------------------------------------------------------------
export async function startCorrection(user: AuthenticatedUser, articleId: string): Promise<ArticleRevision> {
  return prisma.$transaction(async (tx) => {
    const article = await loadArticleOr404(tx, articleId);
    assertOwnerOrAdmin(user, article);
    if (!article.currentPublishedRevisionId) {
      throw new ConflictError("This article isn't published, so there's nothing to correct");
    }
    const published = await tx.articleRevision.findUniqueOrThrow({
      where: { id: article.currentPublishedRevisionId },
    });

    const draft = await copyIntoNewRevision(tx, published, user.id, "DRAFT");
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: draft.id,
      action: "START_CORRECTION",
      articleId,
    });
    return draft;
  });
}

// ---------------------------------------------------------------------------
// T14 — reopen a rejected story (admin only; creates a new DRAFT copy)
// ---------------------------------------------------------------------------
export async function reopen(user: AuthenticatedUser, articleId: string): Promise<ArticleRevision> {
  return prisma.$transaction(async (tx) => {
    await loadArticleOr404(tx, articleId);
    const rejected = await tx.articleRevision.findFirst({
      where: { articleId, state: "REJECTED" },
      orderBy: { createdAt: "desc" },
    });
    if (!rejected) {
      throw new ConflictError("This article has no rejected revision to reopen");
    }

    const draft = await copyIntoNewRevision(tx, rejected, user.id, "DRAFT");
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: draft.id,
      action: "REOPEN",
      articleId,
    });
    return draft;
  });
}

// ---------------------------------------------------------------------------
// T15 — archive a rejected story permanently (admin only)
// ---------------------------------------------------------------------------
export async function archiveRejected(
  user: AuthenticatedUser,
  articleId: string,
  version: number,
): Promise<ArticleRevision> {
  return prisma.$transaction(async (tx) => {
    await loadArticleOr404(tx, articleId);
    const rejected = await tx.articleRevision.findFirst({
      where: { articleId, state: "REJECTED" },
      orderBy: { createdAt: "desc" },
    });
    if (!rejected) {
      throw new ConflictError("This article has no rejected revision to archive");
    }

    await updateRevisionGuarded(tx, rejected.id, version, { state: "ARCHIVED", archivedAt: new Date() });
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: rejected.id,
      action: "ARCHIVE",
      articleId,
    });
    return tx.articleRevision.findUniqueOrThrow({ where: { id: rejected.id } });
  });
}

// ---------------------------------------------------------------------------
// T16 — restore an archived story (admin only; creates a new DRAFT copy).
// Operates on the most recently archived revision. P2-19 notes ARCHIVED
// covers both "taken down" and "abandoned" cases without a schema-level
// distinction between them — this picks the latest by archivedAt as the
// unambiguous, documented-consistent default.
// ---------------------------------------------------------------------------
export async function restore(user: AuthenticatedUser, articleId: string): Promise<ArticleRevision> {
  return prisma.$transaction(async (tx) => {
    await loadArticleOr404(tx, articleId);
    const archived = await tx.articleRevision.findFirst({
      where: { articleId, state: "ARCHIVED" },
      orderBy: { archivedAt: "desc" },
    });
    if (!archived) {
      throw new ConflictError("This article has no archived revision to restore");
    }

    const draft = await copyIntoNewRevision(tx, archived, user.id, "DRAFT");
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "ArticleRevision",
      entityId: draft.id,
      action: "RESTORE",
      articleId,
    });
    return draft;
  });
}
