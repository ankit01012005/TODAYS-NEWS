import Link from "next/link";
import { getPublishedArticles } from "@/lib/api/public";
import { formatPublicTime } from "@/lib/format-date";

/// The latest strip beneath the nav: the newest published
/// stories with their publication time. Real data only — the newest items
/// of the same list the homepage renders, nothing marked "breaking" by
/// hand. One horizontal rail, scrollable at xs.
export async function LatestStrip() {
  const { articles } = await getPublishedArticles();
  const latest = articles.slice(0, 4);
  if (latest.length === 0) return null;

  return (
    <div className="border-b border-rule bg-surface">
      <div className="mx-auto flex max-w-(--width-page-max) items-center gap-x-space-4 px-space-4 md:px-space-5">
        <Link
          href="/#latest"
          className="flex shrink-0 items-center gap-x-space-2 border-r border-rule py-space-2 pr-space-4 text-label text-brand no-underline"
        >
          Latest
        </Link>
        <ul className="no-scrollbar fade-edges flex flex-1 gap-x-space-6 overflow-x-auto py-space-2">
          {latest.map((article) => (
            <li key={article.slug} className="flex shrink-0 items-baseline gap-x-space-2 whitespace-nowrap">
              <time
                dateTime={article.publishedAt}
                className="text-meta tabular-nums text-ink-muted"
              >
                {formatPublicTime(article.publishedAt)}
              </time>
              <Link
                href={`/${article.category.slug}/${article.slug}`}
                className="link-underline text-body-sm text-ink-secondary hover:text-ink"
              >
                {article.headline}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
