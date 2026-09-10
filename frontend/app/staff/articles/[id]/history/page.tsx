import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/CmsShell";
import { requireRole } from "@/lib/api/session";
import { getArticle, getArticleAudit, getRevisionHistory } from "@/lib/api/cms";
import { ReviewDecisionView } from "@/lib/api/cms-types";
import { formatDateTime } from "@/lib/format-date";

export const metadata: Metadata = { title: "Article history — Today News", robots: { index: false } };

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  SUBMIT: "Submitted for review",
  APPROVE: "Approved",
  PUBLISH: "Published",
  REJECT: "Rejected",
  REQUEST_CHANGES: "Changes requested",
  WITHDRAW: "Withdrawn from review",
  UNPUBLISH: "Unpublished",
  START_CORRECTION: "Correction started",
  REOPEN: "Reopened",
  ARCHIVE: "Archived",
  RESTORE: "Restored",
};

/// PG-ADM-05 — "who did what to this story, and when." SEC-11: strictly
/// read-only for everyone, including admins — no edit/delete control
/// exists anywhere on this page. Merges the audit trail (actor + action +
/// time) with each revision's review-decision comments into one
/// chronological timeline, both already ordered oldest-first by the
/// backend.
export default async function ArticleHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("ADMIN");
  const article = await getArticle(id);
  if (!article) notFound();

  const [audit, history] = await Promise.all([getArticleAudit(id), getRevisionHistory(id)]);

  const decisionsByRevisionId = new Map<string, ReviewDecisionView[]>();
  for (const revision of history) {
    decisionsByRevisionId.set(revision.id, revision.reviewDecisions);
  }

  const entries = audit.map((entry) => {
    // REQUEST_CHANGES's audit row is entityId'd to the NEW copy it
    // creates, not the revision the decision was recorded against — the
    // reviewed revision's id lives in metadata instead (transition.service.ts).
    const metadata = entry.metadata as { reviewedRevisionId?: string } | null;
    const lookupRevisionId =
      entry.action === "REQUEST_CHANGES" ? (metadata?.reviewedRevisionId ?? entry.entityId) : entry.entityId;
    const decisions = decisionsByRevisionId.get(lookupRevisionId) ?? [];
    const matchingDecision = decisions.find(
      (d) =>
        (entry.action === "REJECT" && d.decision === "REJECTED") ||
        (entry.action === "REQUEST_CHANGES" && d.decision === "CHANGES_REQUESTED") ||
        (entry.action === "APPROVE" && d.decision === "APPROVED"),
    );
    return { ...entry, comment: matchingDecision?.comment ?? null };
  });

  return (
    <CmsShell user={user}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-2 text-ink">History</h1>
          <p className="mt-space-1 text-body-sm text-ink-muted">/{article.slug}</p>
        </div>
        <Link href={`/staff/articles/${article.id}/edit`} className="text-body-sm text-accent underline">
          Back to article
        </Link>
      </div>

      <div className="mt-space-5 rounded-md border border-rule">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div key={entry.id} className="border-b border-rule px-space-4 py-space-3 last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="text-body text-ink">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                <span className="text-meta text-ink-muted">{formatDateTime(entry.createdAt)}</span>
              </div>
              <p className="mt-space-1 text-body-sm text-ink-muted">{entry.actorDisplayName ?? "System"}</p>
              {entry.comment ? (
                <p className="mt-space-2 rounded-sm bg-surface px-space-3 py-space-2 text-body-sm text-ink-secondary">
                  {entry.comment}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="px-space-4 py-space-5 text-body-sm text-ink-muted">No history recorded yet.</p>
        )}
      </div>
    </CmsShell>
  );
}
