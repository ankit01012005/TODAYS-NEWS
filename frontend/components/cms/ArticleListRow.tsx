import Link from "next/link";
import { ArticleListItemView } from "@/lib/api/cms-types";
import { formatRelative } from "@/lib/format-date";
import { StatusBadge } from "./StatusBadge";

/// docs/19 §4.2 — column order fixed so the eye learns one pattern:
/// Headline | State | Section | Last updated. The whole row is one link
/// target (matches the public card convention — docs/19 §2.5's rule
/// applied to the CMS table too). At xs the meta wraps beneath the
/// headline instead of overflowing.
export function ArticleListRow({ article }: { article: ArticleListItemView }) {
  const current = article.latestRevision ?? article.publishedRevision;
  const state = article.latestRevision?.state ?? article.publishedRevision?.state ?? null;

  return (
    <Link
      href={`/staff/articles/${article.id}/edit`}
      className="group flex flex-wrap items-center gap-x-space-4 gap-y-space-2 border-b border-rule px-space-4 py-space-3 no-underline transition-colors duration-(--duration-fast) last:border-b-0 hover:bg-surface"
    >
      <span className="min-w-0 basis-full truncate text-body text-ink sm:flex-1 sm:basis-auto">
        {current?.headline ?? <span className="text-ink-faint">Untitled</span>}
      </span>
      {state ? <StatusBadge state={state} /> : null}
      <span className="w-28 shrink-0 truncate text-body-sm text-ink-muted">{article.category.name}</span>
      <span className="shrink-0 text-meta tabular-nums text-ink-muted sm:w-32 sm:text-right">
        {formatRelative(article.updatedAt)}
      </span>
    </Link>
  );
}
