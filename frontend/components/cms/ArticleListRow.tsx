import Link from "next/link";
import { ArticleListItemView } from "@/lib/api/cms-types";
import { StatusBadge } from "./StatusBadge";

/// docs/19 §4.2 — column order fixed so the eye learns one pattern:
/// Headline | State | Section | Last updated. The whole row is one link
/// target (matches the public card convention — docs/19 §2.5's rule
/// applied to the CMS table too).
export function ArticleListRow({ article }: { article: ArticleListItemView }) {
  const current = article.latestRevision ?? article.publishedRevision;
  const state = article.latestRevision?.state ?? article.publishedRevision?.state ?? null;

  return (
    <Link
      href={`/staff/articles/${article.id}/edit`}
      className="flex items-center gap-x-space-4 border-b border-rule px-space-3 py-space-3 no-underline hover:bg-surface"
    >
      <span className="min-w-0 flex-1 truncate text-body text-ink">
        {current?.headline ?? <span className="text-ink-faint">Untitled</span>}
      </span>
      {state ? <StatusBadge state={state} /> : null}
      <span className="w-28 shrink-0 truncate text-body-sm text-ink-muted">{article.category.name}</span>
      <span className="w-40 shrink-0 text-right text-meta text-ink-muted">{formatRelative(article.updatedAt)}</span>
    </Link>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
