import { apiBaseUrl } from "./config";
import {
  PublicArticleListResult,
  PublicArticleView,
  PublicCategoryListResult,
  PublicCategoryRef,
} from "./public-types";

/// Server components call these directly at render/revalidation time
/// (docs/23 §4.4 "public reads" row) — no session, no cookie, the same
/// request shape any anonymous reader's browser would get if it could
/// reach the API directly (it can't; docs/23 §11.4).
async function publicFetch<T>(path: string): Promise<T | null> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    // Public pages are cache-first (docs/23 §16) — a later phase wires up
    // real ISR revalidation tags on publish; for now, a short default
    // keeps the homepage from going stale for long without one.
    next: { revalidate: 60 },
  });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Public API request failed: ${res.status} ${path}`);
  }
  return (await res.json()) as T;
}

export async function getPublishedArticles(cursor?: string): Promise<PublicArticleListResult> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const result = await publicFetch<PublicArticleListResult>(`/public/articles${query}`);
  return result ?? { articles: [], nextCursor: null };
}

export async function getPublishedArticle(
  categorySlug: string,
  slug: string,
): Promise<PublicArticleView | null> {
  return publicFetch<PublicArticleView>(
    `/public/articles/${encodeURIComponent(categorySlug)}/${encodeURIComponent(slug)}`,
  );
}

/// docs/19 §2.4 — the masthead's section nav needs every category on every
/// public page, not just section pages.
export async function getCategories(): Promise<PublicCategoryRef[]> {
  const result = await publicFetch<PublicCategoryRef[]>("/public/categories");
  return result ?? [];
}

export async function getCategoryWithArticles(
  categorySlug: string,
  cursor?: string,
): Promise<PublicCategoryListResult | null> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return publicFetch<PublicCategoryListResult>(
    `/public/categories/${encodeURIComponent(categorySlug)}${query}`,
  );
}
