import Link from "next/link";
import { formatEditionDate } from "@/lib/format-date";
import { SITE_NAME } from "@/lib/site";

/// Brief §3 — a publication masthead, not a logo bar: a thin publication
/// strip (edition date, live link), the wordmark, and the masthead rule
/// beneath in the identity red (docs/19 §2.4). The wordmark's full stop is
/// the one place the identity colour touches type.
///
/// docs/19 §2.4 / SEO-09 — no public-facing element ever links into the
/// back-office. There is deliberately no "staff sign-in" link here.
export function Masthead() {
  return (
    <div className="surface-band">
      <div className="mx-auto max-w-(--width-page-max) px-space-4 md:px-space-5">
        <div className="flex items-center justify-between border-b border-rule py-space-2 text-meta text-ink-muted">
          <time dateTime={new Date().toISOString().slice(0, 10)} className="truncate">
            {formatEditionDate()}
          </time>
          <div className="flex items-center gap-x-space-5">
            <Link
              href="/#latest"
              className="inline-flex items-center gap-x-space-2 text-ink-secondary no-underline hover:text-ink"
            >
              <span className="live-dot" aria-hidden="true" />
              Latest
            </Link>
            <Link href="/feed.xml" className="hidden text-ink-muted no-underline hover:text-ink sm:inline">
              RSS
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center py-space-5 md:py-space-6">
          <Link
            href="/"
            className="text-wordmark text-[42px] text-ink no-underline sm:text-[56px] md:text-[72px]"
            aria-label={`${SITE_NAME} — home`}
          >
            {SITE_NAME}
            <span className="text-brand" aria-hidden="true">
              .
            </span>
          </Link>
        </div>
      </div>
      <div className="border-b-2 border-brand" />
    </div>
  );
}
