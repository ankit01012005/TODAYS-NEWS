import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { PulseLine } from "./PulseLine";

/// The ANVAY TV lockup, drawn in type: `ANVAY` in Archivo 800 with tight
/// tracking, `TV` at ~45% of the cap height in Sindoor Red, and the red
/// pulse polyline beneath (design handoff "Type" → Wordmark). One
/// component so the masthead, footer, auth card, CMS header and error
/// page all render the identical mark at different sizes.
///
/// `tone="bone"` is for dark bands. `href={null}` renders a plain span
/// (the footer and skeletons), otherwise the mark links home.
export type WordmarkSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE: Record<WordmarkSize, { mark: number; tv: number; pulse: number; gap: string; tvPad: number }> = {
  xs: { mark: 17, tv: 10, pulse: 96, gap: "gap-x-[3px]", tvPad: 1 },
  sm: { mark: 22, tv: 12, pulse: 124, gap: "gap-x-[4px]", tvPad: 2 },
  md: { mark: 26, tv: 15, pulse: 150, gap: "gap-x-[6px]", tvPad: 3 },
  lg: { mark: 34, tv: 18, pulse: 190, gap: "gap-x-[7px]", tvPad: 4 },
  xl: { mark: 44, tv: 20, pulse: 250, gap: "gap-x-[7px]", tvPad: 5 },
};

export function Wordmark({
  size = "md",
  tone = "ink",
  pulse = true,
  drawPulse = false,
  beatPulse = false,
  href = "/",
  className = "",
  label = `${SITE_NAME} — home`,
}: {
  size?: WordmarkSize;
  tone?: "ink" | "bone";
  pulse?: boolean;
  drawPulse?: boolean;
  beatPulse?: boolean;
  href?: string | null;
  className?: string;
  label?: string;
}) {
  const s = SIZE[size];
  const inkClass = tone === "bone" ? "text-bone" : "text-ink";

  const mark = (
    <span className="inline-flex flex-col items-start">
      <span className={`inline-flex items-end ${s.gap}`}>
        <span
          className={`text-wordmark ${inkClass}`}
          style={{ fontSize: s.mark }}
        >
          ANVAY
        </span>
        <span
          className="text-wordmark text-brand"
          style={{ fontSize: s.tv, letterSpacing: "-0.02em", paddingBottom: s.tvPad }}
        >
          TV
        </span>
      </span>
      {pulse ? (
        <PulseLine
          width={Math.min(s.pulse, Math.round(s.mark * 5.4))}
          color="var(--color-brand)"
          draw={drawPulse}
          beat={beatPulse}
          className="mt-[2px]"
        />
      ) : null}
    </span>
  );

  if (href === null) {
    return (
      <span className={`inline-flex ${className}`} aria-label={SITE_NAME} role="img">
        {mark}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={`inline-flex no-underline ${className}`}>
      {mark}
    </Link>
  );
}
