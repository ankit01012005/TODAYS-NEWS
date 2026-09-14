import { authFetch } from "./session";
import {
  ArticleDetailView,
  ArticleListItemView,
  ArticleSourceView,
  AuditLogView,
  CategoryView,
  MediaAssetView,
  RevisionHistoryEntryView,
  ReviewQueueEntryView,
  SocialPickView,
  SourceView,
  StaffUserView,
} from "./cms-types";

/// Server Component reads — docs/23 §4.4's "CMS reads" row. Every one of
/// these forwards the caller's own session cookie (authFetch); the
/// backend's ownership/capability checks are what actually decide what
/// comes back, not anything here.

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Request failed: ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

export async function listSocialPicks(): Promise<SocialPickView[]> {
  return json(await authFetch("/social-picks"));
}

export async function listMyArticles(): Promise<ArticleListItemView[]> {
  return json(await authFetch("/articles?limit=100"));
}

export async function getArticle(id: string): Promise<ArticleDetailView | null> {
  const res = await authFetch(`/articles/${id}`);
  if (res.status === 404) return null;
  return json(res);
}

export async function getRevisionHistory(id: string): Promise<RevisionHistoryEntryView[]> {
  return json(await authFetch(`/articles/${id}/revisions`));
}

export async function getArticleSources(id: string): Promise<ArticleSourceView[]> {
  return json(await authFetch(`/articles/${id}/sources`));
}

export async function listCategoriesForStaff(): Promise<CategoryView[]> {
  return json(await authFetch("/categories"));
}

export async function listSourcesForStaff(): Promise<SourceView[]> {
  return json(await authFetch("/sources"));
}

export async function listMedia(): Promise<MediaAssetView[]> {
  return json(await authFetch("/media"));
}

/// PG-ADM-02 — admin only (review:approve, same capability the backend
/// gates this route on).
export async function getReviewQueue(): Promise<ReviewQueueEntryView[]> {
  return json(await authFetch("/admin/review-queue"));
}

/// PG-ADM-06 — admin only (user:manage).
export async function listUsers(): Promise<StaffUserView[]> {
  return json(await authFetch("/users"));
}

/// Per-article history — owner or admin (the backend enforces it).
export async function getArticleAudit(id: string): Promise<AuditLogView[]> {
  return json(await authFetch(`/articles/${id}/audit`));
}

/// The global feed (2s) — admin only (audit:view). Raw rows, newest
/// first, without actor names: the page joins those from the staff list.
export interface AuditLogRow {
  id: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  articleId: string | null;
  metadata: unknown;
  createdAt: string;
}

export async function listAudit(limit = 50, offset = 0): Promise<AuditLogRow[]> {
  return json(await authFetch(`/audit?limit=${limit}&offset=${offset}`));
}
