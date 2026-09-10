import type { Metadata } from "next";
import Link from "next/link";
import { CmsShell } from "@/components/cms/CmsShell";
import { Alert } from "@/components/cms/Alert";
import { requireRole } from "@/lib/api/session";
import { getReviewQueue } from "@/lib/api/cms";
import { formatRelative } from "@/lib/format-date";

export const metadata: Metadata = { title: "Review queue — Today News", robots: { index: false } };

/// PG-ADM-02 — "the admin's main workspace." Oldest first (docs/10 A-03:
/// "so the longest-waiting editor is served first"). An empty queue is a
/// success state, not a blank page.
export default async function ReviewQueuePage() {
  const user = await requireRole("ADMIN");
  const queue = await getReviewQueue();

  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">Review queue</h1>
      <div className="mt-space-5">
        {queue.length === 0 ? (
          <Alert variant="success" title="Nothing is waiting" />
        ) : (
          <div className="rounded-md border border-rule">
            {queue.map((entry) => (
              <Link
                key={entry.id}
                href={`/staff/review/${entry.article.id}`}
                className="flex items-center gap-x-space-4 border-b border-rule px-space-3 py-space-3 no-underline last:border-b-0 hover:bg-surface"
              >
                <span className="min-w-0 flex-1 truncate text-body text-ink">
                  {entry.headline ?? <span className="text-ink-faint">Untitled</span>}
                </span>
                <span className="w-32 shrink-0 truncate text-body-sm text-ink-muted">{entry.article.ownerDisplayName}</span>
                <span className="w-28 shrink-0 truncate text-body-sm text-ink-muted">{entry.article.category.name}</span>
                {entry.previouslySentBack ? (
                  <span className="shrink-0 rounded-sm bg-attention-wash px-space-2 py-0.5 text-meta text-ink-secondary">
                    Sent back before
                  </span>
                ) : null}
                <span className="w-32 shrink-0 text-right text-meta text-ink-muted">
                  {entry.submittedAt ? formatRelative(entry.submittedAt) : "—"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CmsShell>
  );
}
