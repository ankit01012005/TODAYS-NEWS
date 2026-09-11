import Link from "next/link";

/// Broadsheet section head: a heavy top rule in the section's tone, the
/// title in editorial serif, and an optional "View all" on the right.
/// `live` adds the pulsing indicator (Just in). One component so every
/// section on the page opens the same way (brief §8: same system,
/// different compositions).
export function SectionHeading({
  title,
  id,
  href,
  hrefLabel = "View all",
  tone = "ink",
  eyebrow,
  live = false,
}: {
  title: string;
  id?: string;
  href?: string;
  hrefLabel?: string;
  tone?: "ink" | "brand" | "gold";
  eyebrow?: string;
  live?: boolean;
}) {
  const rule = tone === "brand" ? "border-brand" : tone === "gold" ? "border-gold" : "border-ink";
  const eyebrowColor = tone === "gold" ? "text-gold-deep" : tone === "brand" ? "text-brand" : "text-ink-muted";

  return (
    <div className={`flex items-end justify-between gap-x-space-4 border-t-2 pt-space-3 ${rule}`}>
      <div>
        {eyebrow ? <p className={`text-label ${eyebrowColor}`}>{eyebrow}</p> : null}
        <h2 id={id} className="flex items-center gap-x-space-3 text-heading-3 text-ink">
          {live ? <span className="live-dot" aria-hidden="true" /> : null}
          {title}
        </h2>
      </div>
      {href ? (
        <Link href={href} className="link-underline shrink-0 text-meta text-ink-secondary hover:text-ink">
          {hrefLabel} <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}
