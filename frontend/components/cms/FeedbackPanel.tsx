"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RevisionHistoryEntryView, ReviewDecisionView } from "@/lib/api/cms-types";
import { formatRelative } from "@/lib/format-date";
import { Panel, PanelTone } from "./Panel";

type DecisionEntry = { decision: ReviewDecisionView; revision: RevisionHistoryEntryView };

const LABEL: Record<ReviewDecisionView["decision"], { title: string; tone: PanelTone }> = {
  CHANGES_REQUESTED: { title: "What the desk asked for", tone: "gold" },
  REJECTED: { title: "Why the desk declined it", tone: "danger" },
  APPROVED: { title: "The desk approved it", tone: "success" },
};

/// 1j — "WHAT THE DESK ASKED FOR": the component the whole workflow
/// depends on. The most recent decision is always shown in full, in the
/// coaching voice; everything before it is one click away under
/// "n earlier rounds" so a long back-and-forth never buries the note
/// that matters right now. `names` turns decidedByUserId into a person.
export function FeedbackPanel({
  history,
  names,
}: {
  history: RevisionHistoryEntryView[];
  names?: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const decisions: DecisionEntry[] = history
    .flatMap((revision) => revision.reviewDecisions.map((decision) => ({ decision, revision })))
    .sort((a, b) => new Date(b.decision.decidedAt).getTime() - new Date(a.decision.decidedAt).getTime());

  const latest = decisions[0];
  if (!latest) return null;
  const earlier = decisions.slice(1);
  const meta = LABEL[latest.decision.decision];
  const who = (id: string) => names?.[id] ?? "The desk";

  return (
    <Panel tone={meta.tone} heading={meta.title}>
      <p className="text-body text-ink">
        {latest.decision.comment ? `“${latest.decision.comment}”` : "No note was left."}
      </p>
      <p className={`mt-space-2 text-caption ${meta.tone === "gold" ? "text-gold-deep" : meta.tone === "danger" ? "text-danger" : "text-success"}`}>
        {who(latest.decision.decidedByUserId)} · {formatRelative(latest.decision.decidedAt)}
        {earlier.length > 0 ? (
          <>
            {" · "}
            <button type="button" onClick={() => setExpanded((v) => !v)} className="underline underline-offset-4" aria-expanded={expanded}>
              {earlier.length} earlier round{earlier.length === 1 ? "" : "s"}
            </button>
          </>
        ) : null}
      </p>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="mt-space-3 overflow-hidden border-l-2 border-ink/15 pl-space-3"
          >
            {earlier.map((entry) => (
              <li key={entry.decision.id} className="py-space-2 text-body-sm text-ink-secondary">
                <span className="text-label text-ink-muted">{LABEL[entry.decision.decision].title}</span>
                <span className="mt-space-1 block">{entry.decision.comment ? `“${entry.decision.comment}”` : "No note."}</span>
                <span className="mt-space-1 block text-mono-sm text-ink-muted">
                  {who(entry.decision.decidedByUserId)} · {formatRelative(entry.decision.decidedAt)} · v{entry.revision.version}
                </span>
              </li>
            ))}
          </motion.ol>
        ) : null}
      </AnimatePresence>
    </Panel>
  );
}
