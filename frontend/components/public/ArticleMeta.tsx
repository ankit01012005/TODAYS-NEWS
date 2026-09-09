import Link from "next/link";

/// docs/19 §3.3 — one line at md+, two lines at xs, `meta` style. Author
/// name is plain text, never a link (author pages are [FUTURE] —
/// PG-PUB-F1, OQ-23; linking it would promise a page that doesn't exist).
/// Section IS a link.
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
      By {byline} ·{" "}
      <Link href={`/${category.slug}`} className="text-ink-muted underline">
        {category.name}
      </Link>{" "}
      · <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>
    </p>
  );
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}, ${date.toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}
