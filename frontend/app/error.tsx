"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

/// 2h — "Something broke on our side. Not you." A red left rule, two
/// buttons, no technical detail ever (SEC-06). This renders when
/// something breaks — quite possibly the API itself — so unlike every
/// other page it does NOT use PublicHeader (which calls the API for the
/// nav): it has no data dependency at all.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="public-site min-h-screen bg-surface text-ink">
      <header>
        <div className="mx-auto max-w-(--width-page-max) px-space-4 py-space-4 md:px-space-6">
          <Wordmark size="md" />
        </div>
        <div className="masthead-rule" aria-hidden="true" />
      </header>
      <main id="content" className="mx-auto max-w-(--width-page-max) px-space-4 py-space-9 md:px-space-6 md:py-space-10">
        <div className="max-w-(--width-measure) border-l-[3px] border-brand pl-space-4 md:pl-space-5">
          <p className="text-mono text-ink-muted">500 · temporarily unavailable</p>
          <h1 className="mt-space-3 text-heading-1 text-ink">Something broke on our side.</h1>
          <p className="mt-space-2 text-body text-ink-secondary">Not you. Try again in a moment.</p>
          <div className="mt-space-5 flex flex-wrap gap-space-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-10 items-center border border-ink bg-paper px-space-4 text-body-sm text-ink transition-colors hover:bg-ink hover:text-paper active:translate-y-px"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center border border-ink bg-paper px-space-4 text-body-sm text-ink no-underline transition-colors hover:bg-ink hover:text-paper"
            >
              Front page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
