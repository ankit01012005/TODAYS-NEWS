import Link from "next/link";
import { ArticleListItemView, ReviewQueueEntryView } from "@/lib/api/cms-types";
import { formatRelative } from "@/lib/format-date";
import { ArticleListRow } from "./ArticleListRow";
import { Alert } from "./Alert";

/// docs/10 A-02 (PG-ADM-01) — an admin's proposed minimum: how many are
/// waiting and for how long (docs/10 §0: "the most useful number on this
/// page is how long the oldest submission has been waiting"), what's
/// sitting back with editors, and what just went out.
export function AdminDashboard({
  queue,
  articles,
}: {
  queue: ReviewQueueEntryView[];
  articles: ArticleListItemView[];
}) {
  const oldest = queue[0] ?? null;
  const sittingWithEditors = articles.filter((a) => a.latestRevision?.state === "CHANGES_REQUESTED");
  const recentlyPublished = articles.filter((a) => a.publicationStatus === "LIVE").slice(0, 5);

  return (
    <div className="space-y-space-6">
      <section>
        <Link href="/staff/review" className="block no-underline">
          {queue.length === 0 ? (
            <Alert variant="success" title="Nothing is waiting" />
          ) : (
            <Alert variant="attention" title={`${queue.length} waiting for review`}>
              {oldest ? `Oldest submission: ${formatRelative(oldest.submittedAt ?? oldest.createdAt)}` : null} — go to the review queue
            </Alert>
          )}
        </Link>
      </section>

      <section>
        <h2 className="text-heading-4 text-ink">Sitting with editors</h2>
        <div className="mt-space-3 rounded-md border border-rule">
          {sittingWithEditors.length > 0 ? (
            sittingWithEditors.map((article) => <ArticleListRow key={article.id} article={article} />)
          ) : (
            <p className="px-space-3 py-space-4 text-body-sm text-ink-muted">
              No stories are currently sent back for changes.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-heading-4 text-ink">Recently published</h2>
        <div className="mt-space-3 rounded-md border border-rule">
          {recentlyPublished.length > 0 ? (
            recentlyPublished.map((article) => <ArticleListRow key={article.id} article={article} />)
          ) : (
            <p className="px-space-3 py-space-4 text-body-sm text-ink-muted">Nothing published yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
