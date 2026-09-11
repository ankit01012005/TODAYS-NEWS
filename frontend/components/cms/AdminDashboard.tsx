import Link from "next/link";
import { ArticleListItemView, ReviewQueueEntryView } from "@/lib/api/cms-types";
import { formatRelative } from "@/lib/format-date";
import { ArticleListRow } from "./ArticleListRow";

/// docs/10 A-02 (PG-ADM-01) — an admin's proposed minimum: how many are
/// waiting and for how long (docs/10 §0: "the most useful number on this
/// page is how long the oldest submission has been waiting"), what's
/// sitting back with editors, and what just went out. Brief §24: the
/// numbers lead, as tiles; the lists follow.
export function AdminDashboard({
  queue,
  articles,
}: {
  queue: ReviewQueueEntryView[];
  articles: ArticleListItemView[];
}) {
  const oldest = queue[0] ?? null;
  const sittingWithEditors = articles.filter((a) => a.latestRevision?.state === "CHANGES_REQUESTED");
  const live = articles.filter((a) => a.publicationStatus === "LIVE");
  const recentlyPublished = live.slice(0, 5);

  return (
    <div className="space-y-space-7">
      <section aria-label="Newsroom at a glance" className="grid grid-cols-1 gap-space-4 sm:grid-cols-3">
        <StatTile
          href="/staff/review"
          label="Waiting for review"
          value={queue.length}
          detail={
            oldest
              ? `Oldest submitted ${formatRelative(oldest.submittedAt ?? oldest.createdAt)}`
              : "Nothing is waiting"
          }
          tone={queue.length > 0 ? "attention" : "success"}
        />
        <StatTile
          href="/staff/articles"
          label="Back with editors"
          value={sittingWithEditors.length}
          detail={sittingWithEditors.length > 0 ? "Changes requested" : "No stories sent back"}
        />
        <StatTile href="/staff/articles" label="Live on the site" value={live.length} detail="Published stories" />
      </section>

      <section>
        <SectionTitle title="Sitting with editors" count={sittingWithEditors.length} />
        <ListFrame>
          {sittingWithEditors.length > 0 ? (
            sittingWithEditors.map((article) => <ArticleListRow key={article.id} article={article} />)
          ) : (
            <EmptyRow>No stories are currently sent back for changes.</EmptyRow>
          )}
        </ListFrame>
      </section>

      <section>
        <SectionTitle title="Recently published" count={recentlyPublished.length} />
        <ListFrame>
          {recentlyPublished.length > 0 ? (
            recentlyPublished.map((article) => <ArticleListRow key={article.id} article={article} />)
          ) : (
            <EmptyRow>Nothing published yet.</EmptyRow>
          )}
        </ListFrame>
      </section>
    </div>
  );
}

function StatTile({
  href,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  href: string;
  label: string;
  value: number;
  detail: string;
  tone?: "neutral" | "attention" | "success";
}) {
  const accent =
    tone === "attention" ? "border-t-attention" : tone === "success" ? "border-t-success" : "border-t-ink";
  return (
    <Link
      href={href}
      className={`group block rounded-md border border-rule border-t-2 bg-paper p-space-5 no-underline shadow-depth-1 transition-[box-shadow,transform] duration-(--duration-base) ease-(--ease-out-quart) hover:-translate-y-px hover:shadow-depth-2 ${accent}`}
    >
      <p className="text-label text-ink-muted">{label}</p>
      <p className="mt-space-2 text-numeral text-ink">{value}</p>
      <p className="mt-space-2 text-body-sm text-ink-secondary">{detail}</p>
    </Link>
  );
}

export function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-baseline gap-x-space-2 border-b-2 border-ink pb-space-2">
      <h2 className="text-heading-4 text-ink">{title}</h2>
      {typeof count === "number" ? <span className="text-meta text-ink-faint">{count}</span> : null}
    </div>
  );
}

export function ListFrame({ children }: { children: React.ReactNode }) {
  return <div className="mt-space-3 overflow-hidden rounded-md border border-rule bg-paper">{children}</div>;
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-space-4 py-space-5 text-body-sm text-ink-muted">{children}</p>;
}
