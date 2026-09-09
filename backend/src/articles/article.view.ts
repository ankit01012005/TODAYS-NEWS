import { Article, ArticleRevision, ReviewDecision } from "@prisma/client";

/// What an API response may contain — the DB row shape, minus nothing
/// sensitive (unlike User, there's no secret field on these two models),
/// but explicit rather than spreading the raw Prisma row so the response
/// shape doesn't silently change if a column is added later.
export interface RevisionView {
  id: string;
  articleId: string;
  state: ArticleRevision["state"];
  headline: string | null;
  summary: string | null;
  body: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  featuredImageId: string | null;
  featuredImageAlt: string | null;
  featuredImageCredit: string | null;
  featuredImageCaption: string | null;
  createdByUserId: string;
  createdAt: Date;
  submittedAt: Date | null;
  publishedAt: Date | null;
  publishedByUserId: string | null;
  archivedAt: Date | null;
  version: number;
}

export interface ArticleDetailView {
  id: string;
  slug: string;
  categoryId: string;
  ownerId: string;
  bylineOverride: string | null;
  publicationStatus: Article["publicationStatus"];
  publishedAt: Date | null;
  firstPublishedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  /// The revision currently being worked on (DRAFT / IN_REVIEW /
  /// CHANGES_REQUESTED / APPROVED) — at most one, per I-1. Null once
  /// nothing is in flight.
  openRevision: RevisionView | null;
  /// What readers see right now — null until first published.
  publishedRevision: RevisionView | null;
}

export function toRevisionView(revision: ArticleRevision): RevisionView {
  return {
    id: revision.id,
    articleId: revision.articleId,
    state: revision.state,
    headline: revision.headline,
    summary: revision.summary,
    body: revision.body,
    seoTitle: revision.seoTitle,
    seoDescription: revision.seoDescription,
    featuredImageId: revision.featuredImageId,
    featuredImageAlt: revision.featuredImageAlt,
    featuredImageCredit: revision.featuredImageCredit,
    featuredImageCaption: revision.featuredImageCaption,
    createdByUserId: revision.createdByUserId,
    createdAt: revision.createdAt,
    submittedAt: revision.submittedAt,
    publishedAt: revision.publishedAt,
    publishedByUserId: revision.publishedByUserId,
    archivedAt: revision.archivedAt,
    version: revision.version,
  };
}

/// One admin decision, as returned to a client — docs/19 §4.5's feedback
/// panel ("admin name, time, and the comment in full").
export interface ReviewDecisionView {
  id: string;
  decision: ReviewDecision["decision"];
  comment: string | null;
  decidedByUserId: string;
  decidedAt: Date;
}

export function toReviewDecisionView(decision: ReviewDecision): ReviewDecisionView {
  return {
    id: decision.id,
    decision: decision.decision,
    comment: decision.comment,
    decidedByUserId: decision.decidedByUserId,
    decidedAt: decision.decidedAt,
  };
}

/// docs/26 §1.5's "revision history — what complete means": every revision
/// ever frozen, kept permanently, each with the decision(s) made on it.
/// Backs PG-ADM-05 (Article history) and the feedback panel's "earlier
/// rounds" list (docs/19 §4.5, §4.7).
export interface RevisionHistoryEntryView extends RevisionView {
  reviewDecisions: ReviewDecisionView[];
}

export function toRevisionHistoryEntryView(
  revision: ArticleRevision & { reviewDecisions: ReviewDecision[] },
): RevisionHistoryEntryView {
  return {
    ...toRevisionView(revision),
    reviewDecisions: revision.reviewDecisions.map(toReviewDecisionView),
  };
}

export function toArticleDetailView(
  article: Article,
  openRevision: ArticleRevision | null,
  publishedRevision: ArticleRevision | null,
): ArticleDetailView {
  return {
    id: article.id,
    slug: article.slug,
    categoryId: article.categoryId,
    ownerId: article.ownerId,
    bylineOverride: article.bylineOverride,
    publicationStatus: article.publicationStatus,
    publishedAt: article.publishedAt,
    firstPublishedAt: article.firstPublishedAt,
    version: article.version,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    openRevision: openRevision ? toRevisionView(openRevision) : null,
    publishedRevision: publishedRevision ? toRevisionView(publishedRevision) : null,
  };
}
