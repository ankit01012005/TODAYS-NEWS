"use server";

import { getCategoryWithArticles, getPublishedArticles } from "@/lib/api/public";
import { PublicArticleListResult } from "@/lib/api/public-types";

/// Server functions behind the reader site's "Load more" buttons (1e, 2f).
/// The browser never talks to the API directly; these run on the server
/// with the same cached, "public"-tagged fetches the pages themselves use,
/// and hand back exactly the shape the API returns.
export async function loadMorePublished(cursor: string): Promise<PublicArticleListResult> {
  return getPublishedArticles(cursor);
}

export async function loadMoreInCategory(categorySlug: string, cursor: string): Promise<PublicArticleListResult> {
  const result = await getCategoryWithArticles(categorySlug, cursor);
  return result ? { articles: result.articles, nextCursor: result.nextCursor } : { articles: [], nextCursor: null };
}
