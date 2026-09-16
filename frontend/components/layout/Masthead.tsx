import Link from "next/link";
import { Search } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { formatMastheadDate } from "@/lib/format-date";
import { SITE_CITY, TV_CONFIG } from "@/lib/site";
import { PublicCategoryRef } from "@/lib/api/public-types";
import { MobileMenu } from "./MobileMenu";

/// 1a "Pulse Front" masthead: the wordmark with its pulse line on the
/// left, the edition line and two pills (LIVE → /tv, Search) on the
/// right, and a 3px Sindoor rule beneath. On a phone (1g) the right side
/// collapses into the hamburger that opens the full menu.
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
            <div className="flex items-center gap-x-space-2">
              <Link
                href="/tv"
                className={`inline-flex h-7 items-center gap-x-space-2 rounded-pill border px-space-3 text-label no-underline transition-colors duration-(--duration-fast) ${
                  isLive
                    ? "border-brand text-brand hover:bg-brand-wash"
                    : "border-rule-strong text-ink hover:border-ink"
                }`}
              >
                <span className={`live-dot live-dot-sm ${isLive ? "live-dot-red" : ""}`} aria-hidden="true" />
                {isLive ? "Live" : "ANVAY TV"}
              </Link>
              <Link
                href="/search"
                className="inline-flex h-7 items-center gap-x-space-1 rounded-pill border border-rule-strong px-space-3 text-label text-ink no-underline transition-colors duration-(--duration-fast) hover:border-ink"
              >
                <Search size={12} strokeWidth={2.4} aria-hidden="true" />
                Search
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-x-space-2 sm:hidden">
            <Link
              href="/search"
              aria-label="Search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-rule-strong text-ink no-underline"
            >
              <Search size={15} strokeWidth={2.2} aria-hidden="true" />
            </Link>
            <MobileMenu categories={categories} isLive={isLive} />
          </div>
        </div>
      </div>
      <div className="masthead-rule" aria-hidden="true" />
    </div>
  );
}
