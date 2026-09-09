"use client";

import { useState } from "react";
import { RevisionHistoryEntryView, ReviewDecisionView } from "@/lib/api/cms-types";
import { Alert, AlertVariant } from "./Alert";

type DecisionEntry = { decision: ReviewDecisionView; revision: RevisionHistoryEntryView };

/// docs/19 §4.5 — "the component the whole workflow depends on." Every
/// decision ever made on this article, newest first; the most recent is
/// always shown expanded, everything before it collapsed under "earlier
/// rounds" so a long back-and-forth doesn't bury the comment that matters
/// right now.
export function FeedbackPanel({ history }: { history: RevisionHistoryEntryView[] }) {
  const [expanded, setExpanded] = useState(false);
  const decisions: DecisionEntry[] = history
    .flatMap((revision) => revision.reviewDecisions.map((decision) => ({ decision, revision })))
    .sort((a, b) => new Date(b.decision.decidedAt).getTime() - new Date(a.decision.decidedAt).getTime());

  const latest = decisions[0];
  if (!latest) return null;
  const earlier = decisions.slice(1);

  return (
    <div className="space-y-space-3">
      <DecisionAlert entry={latest} />
      {earlier.length > 0 ? (
        <div>
          <button type="button" onClick={() => setExpanded(!expanded)} className="text-body-sm text-accent underline">
            {expanded ? "Hide" : "Show"} earlier rounds ({earlier.length})
          </button>
          {expanded ? (
            <div className="mt-space-2 space-y-space-2">
              {earlier.map((entry) => (
                <DecisionAlert key={entry.decision.id} entry={entry} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DecisionAlert({ entry }: { entry: DecisionEntry }) {
  const variant: AlertVariant =
    entry.decision.decision === "REJECTED" ? "danger" : entry.decision.decision === "APPROVED" ? "success" : "attention";
  const label =
    entry.decision.decision === "REJECTED"
      ? "Rejected"
      : entry.decision.decision === "APPROVED"
        ? "Approved"
        : "Changes requested";
  return (
    <Alert variant={variant} title={`${label} — ${formatDate(entry.decision.decidedAt)}`}>
      {entry.decision.comment ?? "No comment provided."}
    </Alert>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
