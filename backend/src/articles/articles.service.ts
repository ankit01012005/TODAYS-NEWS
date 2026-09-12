import { Article, ArticleRevision, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { AuthenticatedUser } from "../common/authenticated-user";
import { ConflictError, ForbiddenError, NotFoundError } from "../common/http-errors";
import { assertOwnerOrAdmin } from "./authorization";
import { Block, assertValidBodyShape, collectImageMediaIds, deriveBodyPlain, resolveImageUrls } from "./body.util";
import { writeAudit } from "../common/audit";
import { UpdateArticleContentDto } from "./dto/update-article-content.dto";
import {
  ArticleListItemView,
  RevisionHistoryEntryView,
  toArticleListItemView,
  toRevisionHistoryEntryView,
} from "./article.view";

/// States in which a revision's content may still be edited (docs/26 §1.3).
const EDITABLE_STATES: ArticleRevision["state"][] = ["DRAFT", "CHANGES_REQUESTED"];

/// An empty or whitespace-only override means "no override" — stored as
/// null so the public byline falls back to the owner's name instead of
/// rendering blank.
export function normaliseBylineOverride(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/// Fail fast on a missing or deactivated category rather than a raw FK
/// error (or, worse, a draft that can never be published).
async function assertCategoryAvailable(tx: Prisma.TransactionClient, categoryId: string): Promise<void> {
  const category = await tx.category.findUnique({ where: { id: categoryId } });
  if (!category || category.deletedAt) {
    throw new NotFoundError("No such category");
  }
}

export async function createArticle(
  user: AuthenticatedUser,
  input: { slug: string; categoryId: string; bylineOverride?: string },
): Promise<{ article: Article; revision: ArticleRevision }> {
  return prisma.$transaction(async (tx) => {
    await assertCategoryAvailable(tx, input.categoryId);
    const bylineOverride = normaliseBylineOverride(input.bylineOverride) ?? null;
    const article = await tx.article.create({
      data: {
        slug: input.slug,
        ownerId: user.id,
        categoryId: input.categoryId,
        bylineOverride,
      },
    });
    const revision = await tx.articleRevision.create({
      data: {
        articleId: article.id,
        state: "DRAFT",
        createdByUserId: user.id,
        categoryId: input.categoryId,
        bylineOverride,
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "Article",
      entityId: article.id,
      action: "CREATE",
      articleId: article.id,
    });
    return { article, revision };
  });
}

/// Fetches an article plus its open revision (if any) and its published
/// revision (if any) — the two situations docs/26 §1 says can coexist.
export async function getArticleWithRevisions(
  user: AuthenticatedUser,
  articleId: string,
): Promise<{ article: Article; openRevision: ArticleRevision | null; publishedRevision: ArticleRevision | null }> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.deletedAt) {
    throw new NotFoundError("No such article");
  }
  assertOwnerOrAdmin(user, article);

  const [openRevision, publishedRevision] = await Promise.all([
    prisma.articleRevision.findFirst({ where: { articleId, openMarker: true } }),
    article.currentPublishedRevisionId
      ? prisma.articleRevision.findUnique({ where: { id: article.currentPublishedRevisionId } })
      : Promise.resolve(null),
  ]);

  return { article, openRevision, publishedRevision };
}

/// docs/26 §1.5's "revision history — what complete means": every revision
/// ever frozen for this article, oldest first, each with the decision(s)
/// made on it. Owner or admin, same as the per-article audit feed —
/// PG-ADM-05 and the feedback panel's "earlier rounds" both read this.
export async function getRevisionHistory(
  user: AuthenticatedUser,
  articleId: string,
): Promise<RevisionHistoryEntryView[]> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.deletedAt) {
    throw new NotFoundError("No such article");
  }
  assertOwnerOrAdmin(user, article);

  const revisions = await prisma.articleRevision.findMany({
    where: { articleId },
    orderBy: { createdAt: "asc" },
    include: { reviewDecisions: { orderBy: { decidedAt: "asc" } } },
  });
  return revisions.map(toRevisionHistoryEntryView);
}

export async function listArticles(
  user: AuthenticatedUser,
  options: { limit: number; offset: number },
): Promise<ArticleListItemView[]> {
  const articles = await prisma.article.findMany({
    where: {
      deletedAt: null,
      // OQ-05's narrow, consistently-assumed answer: an editor sees only
      // their own articles; an admin sees every article.
      ...(user.role === "ADMIN" ? {} : { ownerId: user.id }),
    },
    orderBy: { updatedAt: "desc" },
    take: options.limit,
    skip: options.offset,
    include: { category: true },
  });

  // One row per article, the newest by creation time — `distinct` +
  // `orderBy` (Postgres DISTINCT ON under the hood) rather than filtering
  // on open_marker, which is null for REJECTED/ARCHIVED revisions and so
  // could never represent those states here (see ArticleListItemView's
  // doc-comment for why that matters).
  const latestRevisions = await prisma.articleRevision.findMany({
    where: { articleId: { in: articles.map((a) => a.id) } },
    orderBy: { createdAt: "desc" },
    distinct: ["articleId"],
  });
  const publishedRevisions = await prisma.articleRevision.findMany({
    where: {
      id: { in: articles.map((a) => a.currentPublishedRevisionId).filter((id): id is string => id !== null) },
    },
  });
  const latestByArticleId = new Map(latestRevisions.map((r) => [r.articleId, r]));
  const publishedById = new Map(publishedRevisions.map((r) => [r.id, r]));

  return articles.map((article) =>
    toArticleListItemView(
      article,
      latestByArticleId.get(article.id) ?? null,
      article.currentPublishedRevisionId ? (publishedById.get(article.currentPublishedRevisionId) ?? null) : null,
    ),
  );
}

/// T2/T8 — save. Editable only while the open revision is DRAFT or
/// CHANGES_REQUESTED (docs/26 §1.3); locked during IN_REVIEW so an admin
/// never reviews text that's changing underneath them (OQ-03's working
/// assumption).
///
/// One transaction, one guarded write (docs/27 A1, A2): every field the
/// editor can change — section and byline included — lands on the open
/// revision, and only if its version is still the one the caller saw. A
/// stale save therefore changes nothing at all, and nothing an editor
/// saves can alter what readers see until an admin publishes it.
export async function saveArticleContent(
  user: AuthenticatedUser,
  articleId: string,
  input: UpdateArticleContentDto,
): Promise<ArticleRevision> {
  let body: Block[] | undefined;
  if (input.body !== undefined) {
    assertValidBodyShape(input.body);
    body = input.body;
  }

  return prisma.$transaction(async (tx) => {
    const article = await tx.article.findUnique({ where: { id: articleId } });
    if (!article || article.deletedAt) {
      throw new NotFoundError("No such article");
    }
    assertOwnerOrAdmin(user, article);

    const revision = await tx.articleRevision.findFirst({ where: { articleId, openMarker: true } });
    if (!revision) {
      throw new ConflictError("This article has no open revision to save");
    }
    if (!EDITABLE_STATES.includes(revision.state)) {
      throw new ForbiddenError(`Cannot edit a revision in state ${revision.state}`);
    }

    if (input.categoryId) {
      await assertCategoryAvailable(tx, input.categoryId);
    }

    // Image blocks carry the URL the stored asset was given at upload
    // time — looked up here, never taken from the request.
    if (body !== undefined) {
      const mediaIds = collectImageMediaIds(body);
      const assets =
        mediaIds.length > 0
          ? await tx.mediaAsset.findMany({ where: { id: { in: mediaIds }, deletedAt: null } })
          : [];
      body = resolveImageUrls(body, new Map(assets.map((asset) => [asset.id, asset.url])));
    }

    const result = await tx.articleRevision.updateMany({
      where: { id: revision.id, version: input.version },
      data: {
        headline: input.headline,
        summary: input.summary,
        body: body as object[] | undefined,
        bodyPlain: body !== undefined ? deriveBodyPlain(body) : undefined,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        featuredImageId: input.featuredImageId,
        featuredImageAlt: input.featuredImageAlt,
        featuredImageCredit: input.featuredImageCredit,
        featuredImageCaption: input.featuredImageCaption,
        categoryId: input.categoryId,
        bylineOverride: normaliseBylineOverride(input.bylineOverride),
      },
    });
    if (result.count === 0) {
      // Throwing inside the transaction rolls back everything above.
      throw new ConflictError("This article has changed since you last loaded it. Please refresh and try again.");
    }

    return tx.articleRevision.findUniqueOrThrow({ where: { id: revision.id } });
  });
}
