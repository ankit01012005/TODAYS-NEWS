import Link from "next/link";

/// docs/12 §0 — "Empty: nothing to show, and that's fine. Must explain
/// and offer a next step — never a blank area or a spinner that never
/// ends." Used for the homepage's day-one state and a section with
/// nothing published yet (docs/08 E-03). Set in the editorial voice
/// (brief §22), with a route onward.
export function EmptyState({
  heading,
  body,
  action,
}: {
  heading: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-(--width-measure) border-y border-rule py-space-9 text-center">
      <p className="text-label text-brand">Nothing here yet</p>
      <h2 className="mt-space-3 text-display-2 text-ink">{heading}</h2>
      <p className="mx-auto mt-space-4 max-w-[46ch] text-standfirst text-ink-secondary">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-space-6 inline-flex h-11 items-center rounded-pill border border-ink px-space-5 text-meta text-ink no-underline transition-[background-color,color] duration-(--duration-fast) hover:bg-ink hover:text-paper"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
