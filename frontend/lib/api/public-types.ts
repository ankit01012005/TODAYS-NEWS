/// Mirrors backend/src/public/public.view.ts exactly — the response shapes
/// of the three public routes in backend/src/public/public.router.ts.
/// Keep these two files in sync by hand; there is no shared package yet
/// (a later phase's concern, not this one's).

export interface PublicCategoryRef {
  name: string;
  slug: string;
}

export interface PublicFeaturedImage {
  url: string;
  alt: string;
  credit: string | null;
  caption: string | null;
}

/// The card-listing shape — narrower than PublicFeaturedImage (no credit/
/// caption; a listing card never shows either, per docs/19 §2.5).
export interface PublicSummaryImage {
  url: string;
  alt: string;
}

export interface PublicArticleSummary {
  slug: string;
  category: PublicCategoryRef;
  headline: string;
  summary: string;
  byline: string;
  featuredImage: PublicSummaryImage | null;
  publishedAt: string;
}

export interface PublicSourceRef {
  name: string;
  note: string | null;
  /// Where the source lives online, when the newsroom recorded one —
  /// shown as an outbound link (OQ-24, resolved 2026-09-12).
  url: string | null;
}

/// Mirrors backend/src/social/social.view.ts PublicSocialPickView — the
/// hand-curated "Top on social" rail on the front page.
export type SocialPlatform = "INSTAGRAM" | "X" | "OTHER";

export interface PublicSocialPick {
  id: string;
  platform: SocialPlatform;
  accountHandle: string;
  headline: string;
  url: string;
  createdAt: string;
}

export interface PublicArticleView {
  slug: string;
  category: PublicCategoryRef;
  headline: string;
  summary: string;
  body: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  byline: string;
  featuredImage: PublicFeaturedImage | null;
  publishedAt: string;
  sources: PublicSourceRef[];
}

export interface PublicArticleListResult {
  articles: PublicArticleSummary[];
  nextCursor: string | null;
}

export interface PublicCategoryListResult {
  category: PublicCategoryRef;
  articles: PublicArticleSummary[];
  nextCursor: string | null;
}
