import { getPublishedArticles } from "@/lib/api/public";

/// PG-PUB-M3 — SEO-13. Hand-built RSS 2.0; no dependency needed for a
/// format this small. Summaries only, never full bodies (docs/08 R-06 —
/// "so readers arrive on the site rather than reading it elsewhere").
/// Most-recent page only (no pagination in an RSS feed by convention).
export async function GET(): Promise<Response> {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const { articles } = await getPublishedArticles();

  const items = articles
    .map((article) => {
      const url = `${siteUrl}/${article.category.slug}/${article.slug}`;
      return `    <item>
      <title>${escapeXml(article.headline)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <description>${escapeXml(article.summary)}</description>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <author>${escapeXml(article.byline)}</author>
      <category>${escapeXml(article.category.name)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Today News</title>
    <link>${siteUrl}</link>
    <description>The latest from Today News.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
