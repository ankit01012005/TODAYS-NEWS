import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { formatMastheadDate } from "@/lib/format-date";
import { SITE_CITY, TV_CONFIG } from "@/lib/site";
import { PublicCategoryRef } from "@/lib/api/public-types";
import { MobileMenu } from "./MobileMenu";

/// 1a "Pulse Front" masthead: the wordmark with its pulse line on the
/// left, the edition line and a single LIVE pill (→ /tv) on the right,
/// and a 3px Sindoor rule beneath. On a phone (1g) the right side
/// collapses into the hamburger that opens the full menu.
///
/// One pill, not two. It used to read "ANVAY TV" beside the section nav's
/// own "ANVAY TV" link — the same destination named the same way twice,
/// within 40px of a wordmark already saying it a third time. The pill is
/// now the channel's state rather than its name: LIVE always, and when
/// something genuinely is, the dot and border escalate to Sindoor.
///
/// No public-facing element links into the back-office from here; the
/// one staff link lives in the footer, marked nofollow.
export function Masthead({ categories }: { categories: PublicCategoryRef[] }) {
  const isLive = TV_CONFIG.liveVideoId !== null;

  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-(--width-page-max) px-space-4 md:px-space-6">
        <div className="flex items-end justify-between gap-x-space-6 pb-space-3 pt-space-4 md:pb-space-4 md:pt-space-5">
          <div className="md:hidden">
            <Wordmark size="sm" drawPulse />
          </div>
          <div className="hidden md:block">
            <Wordmark size="md" drawPulse />
          </div>

          <div className="enter-rise hidden flex-col items-end gap-y-space-2 sm:flex" style={{ animationDelay: "240ms" }}>
            <time
              dateTime={new Date().toISOString().slice(0, 10)}
              className="text-caption text-ink-muted"
            >
              {formatMastheadDate()} · {SITE_CITY}
            </time>
            <Link
              href="/tv"
              aria-label={isLive ? "Live now on ANVAY TV" : "ANVAY TV — bulletins and live channel"}
              className={`pill-live inline-flex h-7 items-center gap-x-space-2 rounded-pill border px-space-3 text-label no-underline ${
                isLive
                  ? "border-brand bg-brand-wash text-brand"
                  : "border-rule-strong text-ink hover:border-brand hover:text-brand"
              }`}
            >
              <span className={`live-dot live-dot-sm ${isLive ? "live-dot-red" : ""}`} aria-hidden="true" />
              LIVE
            </Link>
          </div>

          <div className="flex items-center gap-x-space-2 sm:hidden">
            <Link
              href="/tv"
              aria-label={isLive ? "Live now on ANVAY TV" : "ANVAY TV"}
              className={`pill-live inline-flex h-9 items-center gap-x-space-2 rounded-pill border px-space-3 text-label no-underline ${
                isLive ? "border-brand bg-brand-wash text-brand" : "border-rule-strong text-ink"
              }`}
            >
              <span className={`live-dot live-dot-sm ${isLive ? "live-dot-red" : ""}`} aria-hidden="true" />
              LIVE
            </Link>
            <MobileMenu categories={categories} isLive={isLive} />
          </div>
        </div>
      </div>
      <div className="masthead-rule" aria-hidden="true" />
    </div>
  );
}
