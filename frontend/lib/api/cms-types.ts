/// Mirrors backend/src/articles/article.view.ts, backend/src/users/
/// staff-user.view.ts and backend/src/sources/sources.service.ts's
/// (implicit) shapes. Same hand-maintained-mirror convention as
/// lib/api/public-types.ts.

export type RevisionState =
  | "DRAFT"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

export type ArticlePublicationStatus = "NEVER_PUBLISHED" | "LIVE" | "WITHDRAWN";

export interface RevisionView {
  id: string;
  articleId: string;
  state: RevisionState;
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
  createdAt: string;
  submittedAt: string | null;
  publishedAt: string | null;
  publishedByUserId: string | null;
  archivedAt: string | null;
  version: number;
}

export interface ArticleDetailView {
  id: string;
  slug: string;
  categoryId: string;
  ownerId: string;
  bylineOverride: string | null;
  publicationStatus: ArticlePublicationStatus;
  publishedAt: string | null;
  firstPublishedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  openRevision: RevisionView | null;
  publishedRevision: RevisionView | null;
}

export interface RevisionSummaryView {
  id: string;
  state: RevisionState;
  headline: string | null;
  submittedAt: string | null;
  version: number;
}

export interface ArticleListItemView {
  id: string;
  slug: string;
  category: { id: string; name: string; slug: string };
  ownerId: string;
  publicationStatus: ArticlePublicationStatus;
  updatedAt: string;
  latestRevision: RevisionSummaryView | null;
  publishedRevision: RevisionSummaryView | null;
}

export type ReviewDecisionType = "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";

export interface ReviewDecisionView {
  id: string;
  decision: ReviewDecisionType;
  comment: string | null;
  decidedByUserId: string;
  decidedAt: string;
}

export interface RevisionHistoryEntryView extends RevisionView {
  reviewDecisions: ReviewDecisionView[];
}

export interface CategoryView {
  id: string;
  name: string;
  slug: string;
}

export interface SourceView {
  id: string;
  name: string;
  description: string | null;
  verified: boolean;
  createdByUserId: string;
  verifiedByUserId: string | null;
  verifiedAt: string | null;
}

export interface ArticleSourceView {
  id: string;
  articleRevisionId: string;
  sourceId: string;
  position: number;
  isPublic: boolean;
  note: string | null;
  source: SourceView;
}

export interface MediaAssetView {
  id: string;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedByUserId: string;
  createdAt: string;
}

/// docs/10 A-03 (PG-ADM-02) — the review queue's row shape.
export interface ReviewQueueEntryView extends RevisionView {
  article: {
    id: string;
    slug: string;
    ownerId: string;
    ownerDisplayName: string;
    category: CategoryView;
  };
  previouslySentBack: boolean;
}

export type UserRole = "EDITOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "DEACTIVATED";

export interface StaffUserView {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

/// PG-ADM-05 — "who did what, when". Mirrors backend/src/audit/audit.view.ts.
export interface AuditLogView {
  id: string;
  actorUserId: string | null;
  actorDisplayName: string | null;
  entityType: string;
  entityId: string;
  action: string;
  articleId: string | null;
  metadata: unknown;
  createdAt: string;
}
