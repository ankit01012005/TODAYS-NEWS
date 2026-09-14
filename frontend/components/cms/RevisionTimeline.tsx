"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AuditLogView, RevisionHistoryEntryView, RevisionState } from "@/lib/api/cms-types";
import { parseBody, textOf } from "@/lib/api/body-blocks";
import { diffWords } from "@/lib/diff";
import { formatDateTime } from "@/lib/format-date";
import { Button } from "./Button";
import { Pill, StatusBadge } from "./StatusBadge";

const DOT: Record<RevisionState, string> = {
  DRAFT: "bg-state-draft",
  IN_REVIEW: "bg-state-in-review",
  CHANGES_REQUESTED: "bg-gold",
  APPROVED: "bg-state-approved",
  PUBLISHED: "bg-state-published",
  REJECTED: "bg-state-rejected",
  ARCHIVED: "bg-state-archived",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  SAVE: "Saved",
  SUBMIT: "Submitted for review",
  APPROVE: "Approved",
  PUBLISH: "Published",
  REJECT: "Rejected",
  REQUEST_CHANGES: "Sent back with notes",
  WITHDRAW: "Pulled back from review",
  UNPUBLISH: "Withdrawn from the site",
  START_CORRECTION: "Correction started",
  REOPEN: "Reopened",
  ARCHIVE: "Archived",
  RESTORE: "Restored",
  DELETE: "Deleted",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.toLowerCase().replace(/_/g, " ");
}

/// One or two words for a pill in a table column (the audit log).
const SHORT_LABELS: Record<string, string> = {
  CREATE: "Created",
  SAVE: "Saved",
  SUBMIT: "Submitted",
  APPROVE: "Approved",
  PUBLISH: "Published",
  REJECT: "Rejected",
  REQUEST_CHANGES: "Sent back",
  WITHDRAW: "Pulled back",
  UNPUBLISH: "Withdrawn",
  START_CORRECTION: "Correction",
  REOPEN: "Reopened",
  ARCHIVE: "Archived",
  RESTORE: "Restored",
  DELETE: "Deleted",
  RECONCILE_REMOVED: "Reconciled",
  USER_INVITE: "Invited",
  INVITE: "Invited",
  RESEND_INVITATION: "Re-invited",
  DEACTIVATE: "Deactivated",
  REACTIVATE: "Reactivated",
  CHANGE_ROLE: "Role changed",
  VERIFY: "Verified",
};

export function shortActionLabel(action: string): string {
  return SHORT_LABELS[action] ?? action.toLowerCase().replace(/_/g, " ");
}

function plain(revision: RevisionHistoryEntryView): string {
  const body = parseBody(revision.body)
    .map((b) => {
      if (b.type === "paragraph" || b.type === "heading" || b.type === "quote") return textOf(b.content);
      if (b.type === "list") return b.items.map((i) => `• ${textOf(i)}`).join("\n");
      if (b.type === "image") return `[image: ${b.alt}]`;
      return "---";
    })
    .join("\n\n");
  return `${revision.headline ?? ""}\n\n${revision.summary ?? ""}\n\n${body}`.trim();
}

/// 2l — every revision, every decision, newest first (the API returns
/// oldest first; "what happened last" is the question people arrive
/// with). Each revision is a dot on the spine with its state, the
/// decisions recorded against it, the audit actions that touched it, and
/// "Compare with rev n" — a client-side word diff against the previous
/// revision. Nothing here can be edited or removed.
export function RevisionTimeline({
  revisions,
  audit,
  names,
  liveRevisionId,
  articleId,
}: {
  revisions: RevisionHistoryEntryView[];
  audit: AuditLogView[];
  names: Record<string, string>;
  liveRevisionId: string | null;
  articleId: string;
}) {
  // Newest first. `version` is the optimistic-concurrency counter, not a
  // sequence, so revisions are numbered by their order: rev 1 is the
  // first ever written, rev n the latest.
  const ordered = useMemo(() => [...revisions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [revisions]);
  const ordinal = (index: number) => ordered.length - index;
  const [comparing, setComparing] = useState<string | null>(null);
  const who = (id: string | null) => (id ? (names[id] ?? "Someone") : "System");

  const auditByRevision = useMemo(() => {
    const map = new Map<string, AuditLogView[]>();
    for (const entry of audit) {
      const meta = entry.metadata as { reviewedRevisionId?: string } | null;
      const key = entry.action === "REQUEST_CHANGES" ? (meta?.reviewedRevisionId ?? entry.entityId) : entry.entityId;
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [audit]);

  const revisionIds = new Set(revisions.map((r) => r.id));
  const otherEvents = audit.filter((e) => !revisionIds.has(e.entityId) && !(e.action === "REQUEST_CHANGES" && revisionIds.has((e.metadata as { reviewedRevisionId?: string } | null)?.reviewedRevisionId ?? "")));

  return (
    <div>
      <ol className="border-l-2 border-rule pl-space-5">
        {ordered.map((revision, index) => {
          const previous = ordered[index + 1] ?? null;
          const isLive = revision.id === liveRevisionId;
          const events = (auditByRevision.get(revision.id) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          const open = comparing === revision.id;
          return (
            <li key={revision.id} className="relative pb-space-6 last:pb-0">
              <span className={`absolute -left-[27px] top-[5px] h-[11px] w-[11px] rounded-pill ${DOT[revision.state]}`} aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-x-space-2 gap-y-space-1">
                <StatusBadge state={revision.state} />
                <span className="text-mono-sm text-ink-muted">
                  rev {ordinal(index)} · v{revision.version}
                  {isLive ? " · live now" : ""}
                  {revision.state === "ARCHIVED" && !isLive && index > 0 ? " · superseded" : ""}
                </span>
              </div>
              <p className="mt-space-2 text-heading-4 text-ink">{revision.headline || <span className="text-ink-faint">Untitled</span>}</p>
              <p className="mt-space-1 text-caption text-ink-muted">
                {revision.publishedAt
                  ? `Published ${formatDateTime(revision.publishedAt)} by ${who(revision.publishedByUserId)}`
                  : revision.submittedAt
                    ? `Submitted ${formatDateTime(revision.submittedAt)} by ${who(revision.createdByUserId)}`
                    : `Started ${formatDateTime(revision.createdAt)} by ${who(revision.createdByUserId)}`}
              </p>

              {revision.reviewDecisions.map((decision) => (
                <div
                  key={decision.id}
                  className={`mt-space-2 border p-space-3 text-body-sm ${
                    decision.decision === "CHANGES_REQUESTED"
                      ? "border-gold/60 bg-gold-wash text-ink"
                      : decision.decision === "REJECTED"
                        ? "border-danger/50 bg-danger-wash text-ink"
                        : "border-success/50 bg-success-wash text-ink"
                  }`}
                >
                  <p>{decision.comment ? `“${decision.comment}”` : `${decision.decision === "APPROVED" ? "Approved" : decision.decision === "REJECTED" ? "Rejected" : "Sent back"} without a note.`}</p>
                  <p className={`mt-space-1 text-mono-sm ${decision.decision === "CHANGES_REQUESTED" ? "text-gold-deep" : decision.decision === "REJECTED" ? "text-danger" : "text-success"}`}>
                    {who(decision.decidedByUserId)} · {formatDateTime(decision.decidedAt)}
                  </p>
                </div>
              ))}

              {events.length > 0 ? (
                <ul className="mt-space-2 space-y-space-1">
                  {events.map((event) => (
                    <li key={event.id} className="flex flex-wrap items-baseline gap-x-space-2 text-caption text-ink-muted">
                      <span className="text-mono-sm">{formatDateTime(event.createdAt)}</span>
                      <span className="text-ink">{actionLabel(event.action)}</span>
                      <span>· {event.actorDisplayName ?? who(event.actorUserId)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-space-3 flex flex-wrap gap-space-2">
                {isLive || (index === 0 && revision.state !== "ARCHIVED") ? (
                  <Link
                    href={`/staff/articles/${articleId}/preview`}
                    className="inline-flex h-8 items-center border border-ink bg-paper px-space-3 text-body-sm text-ink no-underline transition-colors hover:bg-ink hover:text-paper"
                  >
                    View
                  </Link>
                ) : null}
                {previous ? (
                  <Button variant="secondary" size="sm" onClick={() => setComparing(open ? null : revision.id)} aria-expanded={open}>
                    {open ? "Hide comparison" : `Compare with rev ${ordinal(index + 1)}`}
                  </Button>
                ) : null}
              </div>

              <AnimatePresence initial={false}>
                {open && previous ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <DiffView before={plain(previous)} after={plain(revision)} fromVersion={ordinal(index + 1)} toVersion={ordinal(index)} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>

      {otherEvents.length > 0 ? (
        <div className="mt-space-6 border-t border-rule pt-space-4">
          <p className="text-label text-ink-muted">Other events</p>
          <ul className="mt-space-2 space-y-space-1">
            {otherEvents.map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline gap-x-space-2 text-caption text-ink-muted">
                <span className="text-mono-sm">{formatDateTime(event.createdAt)}</span>
                <span className="text-ink">{actionLabel(event.action)}</span>
                <span>· {event.actorDisplayName ?? who(event.actorUserId)}</span>
                <Pill tone="muted">{event.entityType.toLowerCase()}</Pill>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DiffView({ before, after, fromVersion, toVersion }: { before: string; after: string; fromVersion: number; toVersion: number }) {
  const ops = useMemo(() => diffWords(before, after), [before, after]);
  const added = ops.filter((o) => o.kind === "added").length;
  const removed = ops.filter((o) => o.kind === "removed").length;
  return (
    <div className="mt-space-3 border border-rule-strong bg-paper p-space-4">
      <p className="text-mono-sm text-ink-muted">
        rev {fromVersion} → rev {toVersion} · <span className="text-success">{added} added</span> · <span className="text-danger">{removed} removed</span>
      </p>
      <p className="mt-space-3 whitespace-pre-wrap text-body-sm leading-6 text-ink">
        {ops.map((op, i) =>
          op.kind === "same" ? (
            <span key={i}>{op.text}</span>
          ) : op.kind === "added" ? (
            <ins key={i} className="bg-success-wash text-success no-underline">
              {op.text}
            </ins>
          ) : (
            <del key={i} className="bg-danger-wash text-danger">
              {op.text}
            </del>
          ),
        )}
      </p>
    </div>
  );
}
