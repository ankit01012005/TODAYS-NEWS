import { RevisionState } from "@/lib/api/cms-types";

/// docs/19 §2.6 / §1.1's article state palette — the single most reused
/// component in the CMS. REJECTED is the one documented exception: solid
/// danger fill with white text, never confusable with the outline-style
/// CHANGES_REQUESTED badge (docs/09 §6 — the two must never be mistaken
/// for each other).
const STATE_META: Record<RevisionState, { label: string; dotClass: string; washClass: string; textClass: string }> = {
  DRAFT: { label: "Draft", dotClass: "bg-state-draft", washClass: "bg-surface", textClass: "text-ink-secondary" },
  IN_REVIEW: {
    label: "In review",
    dotClass: "bg-state-in-review",
    washClass: "bg-accent-wash",
    textClass: "text-ink-secondary",
  },
  CHANGES_REQUESTED: {
    label: "Changes requested",
    dotClass: "bg-state-changes-requested",
    washClass: "bg-attention-wash",
    textClass: "text-ink-secondary",
  },
  APPROVED: {
    label: "Approved",
    dotClass: "bg-state-approved",
    washClass: "bg-success-wash",
    textClass: "text-ink-secondary",
  },
  PUBLISHED: {
    label: "Published",
    dotClass: "bg-state-published",
    washClass: "bg-success-wash",
    textClass: "text-ink-secondary",
  },
  REJECTED: { label: "Rejected", dotClass: "", washClass: "bg-danger", textClass: "text-paper" },
  ARCHIVED: {
    label: "Archived",
    dotClass: "bg-state-archived",
    washClass: "bg-surface-sunken",
    textClass: "text-ink-secondary",
  },
};

export function StatusBadge({ state, size = "sm" }: { state: RevisionState; size?: "sm" | "md" }) {
  const meta = STATE_META[state];
  const isRejected = state === "REJECTED";
  const heightClass = size === "sm" ? "h-[22px] text-body-sm" : "h-7 text-body";

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-sm px-space-2 ${heightClass} ${meta.washClass} ${meta.textClass}`}
    >
      {!isRejected ? <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dotClass}`} /> : null}
      {meta.label}
    </span>
  );
}
