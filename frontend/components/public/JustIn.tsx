import Link from "next/link";
import { PublicArticleSummary } from "@/lib/api/public-types";
import { formatPublicTime } from "@/lib/format-date";
import { SectionHeading } from "./SectionHeading";

/// Newest published stories. This feed is cached, so it deliberately
/// avoids a live badge or moving ticker.
export function JustIn({ articles }: { articles: PublicArticleSummary[] }) {
  if (articles.length === 0) return null;

  return (
    <section id="latest" aria-labelledby="latest-heading" className="scroll-mt-24">
      <SectionHeading id="latest-heading" title="Latest" tone="brand" />
      <ol className="divide-y divide-rule">
        {articles.map((article) => (
          <li key={article.slug} className="py-space-3">
            <Link
              href={`/${article.category.slug}/${article.slug}`}
              className="group flex items-start gap-x-space-3 no-underline"
            >
              <time
                dateTime={article.publishedAt}
                className="w-12 shrink-0 pt-[3px] text-meta tabular-nums text-brand"
              >
                {formatPublicTime(article.publishedAt)}
              </time>
              <div className="min-w-0">
                <h3 className="text-headline-sm text-ink">
                  <span className="link-underline">{article.headline}</span>
                </h3>
                <p className="mt-space-1 text-meta text-ink-muted">{article.category.name}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
