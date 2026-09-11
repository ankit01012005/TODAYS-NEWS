import Link from "next/link";
import { formatPublicDateTime } from "@/lib/format-date";

/// docs/19 §3.3 — one line at md+, two lines at xs, `meta` style. Author
/// name is plain text, never a link (author pages are [FUTURE] —
/// PG-PUB-F1, OQ-23; linking it would promise a page that doesn't exist).
/// Section IS a link. Used by the CMS preview so it reads exactly as the
/// public article header does.
export function ArticleMeta({
  byline,
  category,
  publishedAt,
}: {
  byline: string;
  category: { name: string; slug: string };
  publishedAt: string;
}) {
  return (
    <p className="text-meta text-ink-muted">
      <span className="text-ink">By {byline}</span> ·{" "}
      <Link href={`/${category.slug}`} className="link-underline text-ink-muted">
        {category.name}
      </Link>{" "}
      · <time dateTime={publishedAt}>{formatPublicDateTime(publishedAt)}</time>
    </p>
  );
}
