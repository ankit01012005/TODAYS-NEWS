import Link from "next/link";
import { formatEditionDate } from "@/lib/format-date";
import { SITE_NAME } from "@/lib/site";

/// Brief §3 — a publication masthead, not a logo bar: a thin publication
/// strip (edition date and useful links), the wordmark, and a slim
/// signature rule beneath it. The compact stack protects the first screen
/// for reporting.
///
/// docs/19 §2.4 / SEO-09 — no public-facing element ever links into the
/// back-office. There is deliberately no "staff sign-in" link here.
export function Masthead() {
  return (
    <div className="public-masthead">
      <div className="mx-auto max-w-(--width-page-max) px-space-4 md:px-space-5">
        <div className="flex min-h-9 items-center justify-between border-b border-rule py-space-2 font-mono text-[11px] tracking-[0.03em] text-ink-muted">
          <time dateTime={new Date().toISOString().slice(0, 10)} className="truncate uppercase">
            {formatEditionDate()}
          </time>
          <div className="flex items-center gap-x-space-5">
            <Link
              href="/#latest"
              className="link-underline text-ink-secondary no-underline hover:text-ink"
            >
              Latest coverage
            </Link>
            <Link href="/feed.xml" className="hidden text-ink-muted no-underline hover:text-ink sm:inline">
              RSS
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between py-space-4 md:py-space-5">
          <span className="hidden w-32 text-label text-ink-muted md:block">Public edition</span>
          <Link
            href="/"
            className="public-wordmark no-underline"
            aria-label={`${SITE_NAME} — home`}
          >
            <span>{SITE_NAME}</span>
            <span className="wordmark-signature" aria-hidden="true" />
          </Link>
          <span className="hidden max-w-32 text-right font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted md:block">
            Atlas edition
          </span>
        </div>
      </div>
      <div className="editorial-rule" aria-hidden="true" />
    </div>
  );
}
