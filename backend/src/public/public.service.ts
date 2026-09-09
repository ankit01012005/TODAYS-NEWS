import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { NotFoundError } from "../common/http-errors";
import { Cursor, decodeCursor, encodeCursor } from "./cursor";
import { PublicArticleSummary, PublicArticleView, toPublicArticleView } from "./public.view";

const PAGE_SIZE = 20;

function featuredImageUrl(storageKey: string | null): string | null {
  return storageKey ? `/uploads/${storageKey}` : null;
}

/// BR-01 — the query, not the view, is the control: publicationStatus is
/// LIVE if and only if currentPublishedRevisionId is set (I-4, enforced by
/// a database CHECK constraint), so this filter can never leak a draft.
function liveWhere(extra: Prisma.ArticleWhereInput = {}): Prisma.ArticleWhereInput {
  return { publicationStatus: "LIVE", deletedAt: null, ...extra };
}

export async function listPublished(
  cursorRaw: string | undefined,
  categorySlug?: string,
): Promise<{ articles: PublicArticleSummary[]; nextCursor: string | null }> {
  const cursor = decodeCursor(cursorRaw);
  const where = liveWhere({
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(cursor ? { OR: keysetOr(cursor) } : {}),
  });

  const articles = await prisma.article.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    include: { category: true, owner: true },
  });

  const hasMore = articles.length > PAGE_SIZE;
  const page = hasMore ? articles.slice(0, PAGE_SIZE) : articles;

  const revisions = await prisma.articleRevision.findMany({
    where: { id: { in: page.map((a) => a.currentPublishedRevisionId!).filter(Boolean) } },
    include: { featuredImage: true },
  });
  const revisionById = new Map(revisions.map((r) => [r.id, r]));

  // card-lead / card-standard (docs/19 §2.5) both require an image slot and
  // a byline — omitted here originally, which would have shipped a
  // homepage that couldn't actually render either component as designed.
  const summaries: PublicArticleSummary[] = page.map((article) => {
    const revision = revisionById.get(article.currentPublishedRevisionId!);
    const imageUrl = featuredImageUrl(revision?.featuredImage?.storageKey ?? null);
    return {
      slug: article.slug,
      category: { name: article.category.name, slug: article.category.slug },
      headline: revision?.headline ?? "",
      summary: revision?.summary ?? "",
      byline: article.bylineOverride ?? article.owner.displayName,
      featuredImage:
        imageUrl && revision ? { url: imageUrl, alt: revision.featuredImageAlt ?? "" } : null,
      publishedAt: (article.publishedAt ?? article.createdAt).toISOString(),
    };
  });

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({ publishedAt: (last.publishedAt ?? last.createdAt).toISOString(), id: last.id })
      : null;

  return { articles: summaries, nextCursor };
}

function keysetOr(cursor: Cursor): Prisma.ArticleWhereInput[] {
  return [
    { publishedAt: { lt: new Date(cursor.publishedAt) } },
    { publishedAt: new Date(cursor.publishedAt), id: { lt: cursor.id } },
  ];
}

export async function getPublishedArticle(categorySlug: string, slug: string): Promise<PublicArticleView> {
  const article = await prisma.article.findFirst({
    where: liveWhere({ slug, category: { slug: categorySlug } }),
    include: { category: true, owner: true },
  });
  // SEC-03 — a wrong slug, an unpublished story and a withdrawn story must
  // all produce the identical response.
  if (!article || !article.currentPublishedRevisionId) {
    throw new NotFoundError("No such article");
  }

  const revision = await prisma.articleRevision.findUniqueOrThrow({
    where: { id: article.currentPublishedRevisionId },
    include: { featuredImage: true },
  });

  const sources = await prisma.articleSource.findMany({
    where: { articleRevisionId: revision.id, isPublic: true },
    orderBy: { position: "asc" },
    include: { source: true },
  });

  return toPublicArticleView(
    article,
    revision,
    featuredImageUrl(revision.featuredImage?.storageKey ?? null),
    sources.map((s) => ({ name: s.source.name, note: s.note })),
  );
}

export async function getCategory(slug: string): Promise<{ name: string; slug: string }> {
  const category = await prisma.category.findFirst({ where: { slug, deletedAt: null } });
  if (!category) throw new NotFoundError("No such category");
  return { name: category.name, slug: category.slug };
}

/// docs/19 §2.4 — the masthead's section nav needs the full category list
/// on every public page, not just section pages. The only categories
/// endpoint before this (GET /categories) sits behind sessionAuth for the
/// CMS; this is its public, read-only counterpart.
export async function listCategories(): Promise<{ name: string; slug: string }[]> {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
  return categories.map((c) => ({ name: c.name, slug: c.slug }));
}
