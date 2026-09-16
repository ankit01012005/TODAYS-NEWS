import { RevisionState } from "@/lib/api/cms-types";

/// The seven RevisionState values as outline pills — one badge
/// component, used on every list and every toolbar (1i). The colours are
/// the handoff's article-state palette. CHANGES_REQUESTED sits on the
/// gold wash with gold-deep ink; REJECTED is the one solid fill, so it
/// can never be mistaken for a note to revise.
const STATE_META: Record<RevisionState, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "border-state-draft text-state-draft" },
  IN_REVIEW: { label: "In review", className: "border-state-in-review text-state-in-review" },
  CHANGES_REQUESTED: {
    label: "Changes requested",
    className: "border-gold bg-gold-wash text-gold-deep",
  },
  APPROVED: { label: "Approved", className: "border-state-approved text-state-approved" },
  PUBLISHED: { label: "Published", className: "border-state-published text-state-published" },
  REJECTED: { label: "Rejected", className: "border-state-rejected bg-state-rejected text-paper" },
  ARCHIVED: { label: "Archived", className: "border-state-archived text-state-archived" },
};

export function stateLabel(state: RevisionState): string {
  return STATE_META[state].label;
}

export function StatusBadge({
  state,
  size = "sm",
  onDark = false,
  className = "",
}: {
  state: RevisionState;
  size?: "sm" | "md";
  onDark?: boolean;
  className?: string;
}) {
  const meta = STATE_META[state];
  const sizeClass = size === "sm" ? "h-6 px-space-2 text-label" : "h-7 px-space-3 text-label-lg";
  // On the dark toolbar the wash and the muted greys disappear; brighten.
  const dark =
    onDark && state === "CHANGES_REQUESTED"
      ? "border-gold bg-transparent text-gold"
      : onDark && state === "IN_REVIEW"
        ? "border-[#9CC4E4] text-[#9CC4E4]"
        : onDark && (state === "DRAFT" || state === "ARCHIVED")
          ? "border-bone/50 text-bone"
          : "";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-x-space-1 whitespace-nowrap rounded-pill border ${sizeClass} ${dark || meta.className} ${className}`}
    >
      {meta.label}
    </span>
  );
}

/// The story is live on the site — publicationStatus, not a revision
/// state. Green dot with a slow ring, so a list scans for what readers
/// can see right now.
export function LiveBadge({ size = "sm", className = "" }: { size?: "sm" | "md"; className?: string }) {
  const sizeClass = size === "sm" ? "h-6 px-space-2 text-label" : "h-7 px-space-3 text-label-lg";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-x-space-2 whitespace-nowrap rounded-pill border border-success ${sizeClass} text-success ${className}`}
    >
      <span className="live-dot live-dot-sm" aria-hidden="true" />
      Live
    </span>
  );
}

/// Generic small pill for roles, platforms and counts.
export function Pill({
  children,
  tone = "ink",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "ink" | "muted" | "brand" | "gold" | "success" | "bone";
  className?: string;
}) {
  const color =
    tone === "brand"
      ? "border-brand text-brand"
      : tone === "gold"
        ? "border-gold-deep text-gold-deep"
        : tone === "success"
          ? "border-success text-success"
          : tone === "muted"
            ? "border-rule-strong text-ink-muted"
            : tone === "bone"
              ? "border-bone/40 text-bone"
              : "border-rule-strong text-ink";
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-x-space-1 whitespace-nowrap rounded-pill border px-space-2 text-label ${color} ${className}`}>
      {children}
    </span>
  );
}
