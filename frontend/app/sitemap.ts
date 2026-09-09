import type { MetadataRoute } from "next";
import { getPublishedArticles } from "@/lib/api/public";

/// PG-PUB-M1 — SEO-08. Walks every published article via the same cursor
/// pagination the homepage uses, until exhausted. Withdrawn articles leave
/// the sitemap immediately because they leave getPublishedArticles'
/// result the moment publicationStatus stops being LIVE (SEO-14) — there's
/// no separate "sitemap membership" state to fall out of sync.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/editorial-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let cursor: string | undefined;
  do {
    const page = await getPublishedArticles(cursor);
    for (const article of page.articles) {
      entries.push({
        url: `${siteUrl}/${article.category.slug}/${article.slug}`,
        lastModified: article.publishedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return entries;
}
