import Link from "next/link";
import { PublicArticleSummary } from "@/lib/api/public-types";
import { formatPublicTime } from "@/lib/format-date";
import { SectionHeading } from "./SectionHeading";

/// 1a's right rail — "JUST IN": the newest published stories with a red
/// mono timestamp each, separated by hairline rules. Cached like the
/// rest of the page; the Pulse band above is the moving element, this
/// one stays still so it can be read.
export function JustIn({ articles, className = "" }: { articles: PublicArticleSummary[]; className?: string }) {
  if (articles.length === 0) return null;

  return (
    <section id="just-in" aria-labelledby="just-in-heading" className={`scroll-mt-24 ${className}`}>
      <SectionHeading id="just-in-heading" title="Just in" tone="brand" />
      <ol className="reveal-stagger divide-y divide-rule">
        {articles.map((article) => (
          <li key={article.slug} className="reveal py-space-3">
            <Link
              href={`/${article.category.slug}/${article.slug}`}
              className="group block no-underline"
            >
              <time dateTime={article.publishedAt} className="text-mono text-brand">
                {formatPublicTime(article.publishedAt)}
              </time>
              <h3 className="mt-space-1 text-headline-sm text-ink">
                <span className="link-underline">{article.headline}</span>
              </h3>
              <p className="mt-space-1 text-caption text-ink-muted">{article.category.name}</p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
