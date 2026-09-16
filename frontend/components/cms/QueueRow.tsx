import Link from "next/link";
import { ReviewQueueEntryView } from "@/lib/api/cms-types";
import { formatWaiting, hoursSince } from "@/lib/format-date";
import { Pill } from "./StatusBadge";

/// 1k — one review-queue row: the waiting time is the loudest thing on
/// it (red past 24h, gold past 8h), then the headline, the section, who
/// wrote it, and "sent back before" when the story has been round the
/// desk already. The whole row opens the decision page; the button is
/// for the eye.
export function QueueRow({ entry, primary = false }: { entry: ReviewQueueEntryView; primary?: boolean }) {
  const since = entry.submittedAt ?? entry.createdAt;
  const hours = hoursSince(since);
  const tone = hours >= 24 ? "text-brand" : hours >= 8 ? "text-gold-deep" : "text-ink-muted";

  return (
    <Link
      href={`/staff/review/${entry.article.id}`}
      className="group flex items-center gap-x-space-4 border-b border-rule px-space-4 py-space-3 no-underline transition-colors duration-(--duration-fast) last:border-b-0 hover:bg-surface-sunken"
    >
      <span className="w-[68px] shrink-0 text-center">
        <span className={`block text-numeral-sm ${tone}`}>{formatWaiting(since)}</span>
        <span className="block text-caption text-ink-muted">waiting</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-heading-4 text-ink">
          <span className="link-underline">{entry.headline || <span className="text-ink-faint">Untitled</span>}</span>
        </span>
        <span className="mt-space-1 flex flex-wrap items-center gap-x-space-2 gap-y-space-1">
          <Pill tone="muted">{entry.article.category.name}</Pill>
          <span className="text-caption text-ink-muted">by {entry.article.ownerDisplayName}</span>
          {entry.previouslySentBack ? <Pill tone="gold">sent back before</Pill> : null}
        </span>
      </span>
      <span
        className={`hidden h-9 shrink-0 items-center px-space-3 text-body-sm font-medium sm:inline-flex ${
          primary ? "bg-accent text-paper" : "border border-ink bg-paper text-ink group-hover:bg-ink group-hover:text-paper"
        }`}
        aria-hidden="true"
      >
        Open
      </span>
    </Link>
  );
}
