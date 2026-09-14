import Link from "next/link";
import { ArrowRight } from "lucide-react";

/// The brand's section head: an uppercase label over a rule. Three
/// tones — ink (desk sections, "MORE IN INDIA"), brand ("JUST IN", red
/// label over a 2px ink rule), gold (curation: "TOP ON SOCIAL",
/// "EDITOR'S PICKS"). Optional "All India →" link on the right.
export function SectionHeading({
  title,
  id,
  href,
  hrefLabel = "View all",
  tone = "ink",
  live = false,
  className = "",
}: {
  title: string;
  id?: string;
  href?: string;
  hrefLabel?: string;
  tone?: "ink" | "brand" | "gold";
  live?: boolean;
  className?: string;
}) {
  const rule = tone === "gold" ? "bg-gold" : "bg-ink";
  const label = tone === "gold" ? "text-gold-deep" : tone === "brand" ? "text-brand" : "text-ink";

  return (
    <div className={`relative flex items-end justify-between gap-x-space-4 pb-space-2 ${className}`}>
      <span className={`rule-draw absolute inset-x-0 bottom-0 h-[2px] ${rule}`} aria-hidden="true" />
      <h2 id={id} className={`flex items-center gap-x-space-2 text-label-lg ${label}`}>
        {live ? <span className="live-dot live-dot-sm live-dot-red" aria-hidden="true" /> : null}
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="link-underline inline-flex shrink-0 items-center gap-x-space-1 text-caption text-ink-muted hover:text-ink"
        >
          {hrefLabel} <ArrowRight size={12} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
