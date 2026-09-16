import { connection } from "next/server";
import { apiBaseUrl } from "./config";
import {
  PublicArticleListResult,
  PublicArticleView,
  PublicCategoryListResult,
  PublicCategoryRef,
  PublicSocialPick,
} from "./public-types";

/// The one cache tag every public read carries — what the API asks
/// /api/revalidate to drop after a publish or withdrawal.
export const PUBLIC_CACHE_TAG = "public";

/// Server components call these directly at render/revalidation time
/// (docs/23 §4.4 "public reads" row) — no session, no cookie, the same
/// request shape any anonymous reader's browser would get if it could
/// reach the API directly (it can't; docs/23 §11.4).
async function publicFetch<T>(path: string): Promise<T | null> {
  // Public API data must be loaded only after a real request exists. This
  // keeps `next build` independent of backend availability while preserving
  // the explicit 60-second data cache below at runtime.
  await connection();

  const res = await fetch(`${apiBaseUrl()}${path}`, {
    // Public pages are cache-first (docs/23 §16). The API purges the
    // "public" tag through /api/revalidate the moment a story is
    // published, corrected or withdrawn (docs/27 B3); the 60 s window is
    // only the safety net if that call ever fails.
    next: { revalidate: 60, tags: [PUBLIC_CACHE_TAG] },
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

/// The masthead's section nav needs every category on every public page,
/// not just section pages — including the 404 and the static pages, which
/// have no story data of their own. A failure here therefore degrades to
/// an empty nav rather than taking the whole page down with it; the pages
/// that genuinely need stories still throw from their own fetches.
export async function getCategories(): Promise<PublicCategoryRef[]> {
  try {
    const result = await publicFetch<PublicCategoryRef[]>("/public/categories");
    return result ?? [];
  } catch {
    return [];
  }
}

/// The same tolerance for the chrome's "latest" strips (the Pulse band,
/// the 404 page's "Meanwhile") — an empty list, never an error page.
export async function getPublishedArticlesOrEmpty(): Promise<PublicArticleListResult> {
  try {
    return await getPublishedArticles();
  } catch {
    return { articles: [], nextCursor: null };
  }
}

/// Brief §6/§7-adjacent — the front page's "Top on social" rail. Curated
/// by hand in the CMS; empty is a normal state (the rail just doesn't
/// render), and a failure here must never take the front page down.
export async function getSocialPicks(): Promise<PublicSocialPick[]> {
  try {
    return (await publicFetch<PublicSocialPick[]>("/public/social-picks")) ?? [];
  } catch {
    return [];
  }
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
