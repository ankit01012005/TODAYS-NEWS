import { Article, ArticleRevision, Category, User } from "@prisma/client";

/// What a reader may ever see. Deliberately narrow — no internal ids beyond
/// what's needed to link, no owner email, no version/audit fields. BR-01 is
/// enforced by the query (publicationStatus = LIVE), not by this shaping —
/// but this is the second layer that keeps a leak from becoming a real one.
export interface PublicArticleView {
  slug: string;
  category: { name: string; slug: string };
  headline: string;
  summary: string;
  body: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  byline: string;
  featuredImage: {
    url: string;
    alt: string;
    credit: string | null;
    caption: string | null;
  } | null;
  publishedAt: string;
  sources: { name: string; note: string | null }[];
}

export function toPublicArticleView(
  article: Article & { category: Category; owner: User },
  revision: ArticleRevision,
  featuredImageUrl: string | null,
  publicSources: { name: string; note: string | null }[],
): PublicArticleView {
  return {
    slug: article.slug,
    category: { name: article.category.name, slug: article.category.slug },
    headline: revision.headline ?? "",
    summary: revision.summary ?? "",
    body: revision.body,
    seoTitle: revision.seoTitle,
    seoDescription: revision.seoDescription,
    byline: article.bylineOverride ?? article.owner.displayName,
    featuredImage:
      revision.featuredImageId && featuredImageUrl
        ? {
            url: featuredImageUrl,
            alt: revision.featuredImageAlt ?? "",
            credit: revision.featuredImageCredit,
            caption: revision.featuredImageCaption,
          }
        : null,
    publishedAt: (article.publishedAt ?? article.firstPublishedAt ?? article.createdAt).toISOString(),
    sources: publicSources,
  };
}

export interface PublicArticleSummary {
  slug: string;
  category: { name: string; slug: string };
  headline: string;
  summary: string;
  publishedAt: string;
}
