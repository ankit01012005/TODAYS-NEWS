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

/// The light shape for a LIST of articles — docs/09 §0: state is "the
/// single most important piece of information in this whole area", but a
/// list must not carry every row's full body/SEO/image content (PRF-06 —
/// bounded lists). Deliberately narrower than RevisionView.
export interface RevisionSummaryView {
  id: string;
  state: ArticleRevision["state"];
  headline: string | null;
  submittedAt: Date | null;
  version: number;
}

function toRevisionSummaryView(revision: ArticleRevision): RevisionSummaryView {
  return {
    id: revision.id,
    state: revision.state,
    headline: revision.headline,
    submittedAt: revision.submittedAt,
    version: revision.version,
  };
}

/// One row of My Articles (docs/12 PG-EDT-06) or All Articles
/// (PG-ADM-04 — this same shape, just without the ownership filter
/// `listArticles` applies for an editor).
///
/// `latestRevision` is the most recently created revision regardless of
/// state — NOT the same thing as "the open one". REJECTED and ARCHIVED
/// revisions carry no open_marker (docs/26 §1.3: "open" only covers
/// DRAFT/IN_REVIEW/CHANGES_REQUESTED/APPROVED), so a field that only ever
/// showed the open revision could never represent "this story was
/// rejected" — docs/09 §6 E-06 requires exactly that to be visible. Using
/// the newest revision unconditionally covers every state uniformly,
/// including the case where a LIVE article's newest revision is a
/// still-in-review correction sitting alongside its still-published one.
export interface ArticleListItemView {
  id: string;
  slug: string;
  category: { id: string; name: string; slug: string };
  ownerId: string;
  publicationStatus: Article["publicationStatus"];
  updatedAt: Date;
  latestRevision: RevisionSummaryView | null;
  publishedRevision: RevisionSummaryView | null;
}

export function toArticleListItemView(
  article: Article & { category: { id: string; name: string; slug: string } },
  latestRevision: ArticleRevision | null,
  publishedRevision: ArticleRevision | null,
): ArticleListItemView {
  return {
    id: article.id,
    slug: article.slug,
    category: article.category,
    ownerId: article.ownerId,
    publicationStatus: article.publicationStatus,
    updatedAt: article.updatedAt,
    latestRevision: latestRevision ? toRevisionSummaryView(latestRevision) : null,
    publishedRevision: publishedRevision ? toRevisionSummaryView(publishedRevision) : null,
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
