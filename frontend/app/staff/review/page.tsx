import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { QueueRow } from "@/components/cms/QueueRow";
import { ListFrame, PageHeader, CmsEmpty } from "@/components/cms/Panel";
import { Reveal } from "@/components/motion/Reveal";
import { requireRole } from "@/lib/api/session";
import { getReviewQueue } from "@/lib/api/cms";
import { formatWaiting, hoursSince } from "@/lib/format-date";

export const metadata: Metadata = { title: "Review queue", robots: { index: false } };

/// 1k — "the admin's main workspace." Oldest first, so the longest-
/// waiting editor is served first; waiting time is the loudest number on
/// each row. An empty queue is a success state, not a blank page.
export default async function ReviewQueuePage() {
  const user = await requireRole("ADMIN");
  const queue = await getReviewQueue();
  const oldest = queue[0] ?? null;
  const oldestSince = oldest ? (oldest.submittedAt ?? oldest.createdAt) : null;
  const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

  return (
    <CmsShell user={user} reviewCount={queue.length} width="wide">
      <Reveal>
        <PageHeader
          title={queue.length === 0 ? "The queue is clear." : `${words[queue.length] ?? queue.length} ${queue.length === 1 ? "story is" : "stories are"} waiting.`}
          lede={
            oldestSince
              ? hoursSince(oldestSince) >= 24
                ? `The oldest has been in the queue for ${formatWaiting(oldestSince)}. Start there.`
                : `The oldest has been waiting ${formatWaiting(oldestSince)}.`
              : "Nothing is waiting for a decision."
          }
        />
      </Reveal>
      <Reveal delay={0.05} className="mt-space-5">
        {queue.length === 0 ? (
          <CmsEmpty title="Nothing to review" body="When an editor submits a story it appears here, oldest first." />
        ) : (
          <ListFrame>
            {queue.map((entry, index) => (
              <QueueRow key={entry.id} entry={entry} primary={index === 0} />
            ))}
          </ListFrame>
        )}
      </Reveal>
    </CmsShell>
  );
}
