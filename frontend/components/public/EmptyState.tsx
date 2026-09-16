import Link from "next/link";

/// 2t "Empty — first run": a dashed frame, a plain sentence, and a route
/// onward. Used for the homepage's day-one state, a section with nothing
/// published yet, and a search with no matches. Never a blank area.
export function EmptyState({
  heading,
  body,
  action,
  children,
  className = "",
}: {
  heading: string;
  body: string;
  action?: { href: string; label: string };
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-dashed border-rule-strong px-space-5 py-space-8 text-center ${className}`}>
      <p className="text-label text-brand">Nothing here yet</p>
      <h2 className="mt-space-3 text-heading-2 text-ink">{heading}</h2>
      <p className="mx-auto mt-space-3 max-w-[48ch] text-body text-ink-secondary">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-space-5 inline-flex h-10 items-center bg-brand px-space-5 text-body-sm font-medium text-paper no-underline transition-colors duration-(--duration-fast) hover:bg-brand-deep"
        >
          {action.label}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
