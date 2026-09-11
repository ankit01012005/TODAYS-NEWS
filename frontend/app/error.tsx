"use client";

import Link from "next/link";

/// PG-PUB-10. docs/08 E-06: a plain apology, the masthead, and a link
/// home — no technical details, ever (SEC-06). This component is what
/// renders when something breaks, quite possibly the backend API itself
/// — so unlike every other page, it deliberately does NOT use
/// PublicHeader (an async server component that calls the API for the
/// section nav): if the API is what's down, that fetch would fail too and
/// take the error page down with it. This renders unconditionally, with
/// no data dependency at all.
/// `error` is part of Next's required error-boundary prop signature but
/// deliberately unused in the body — SEC-06: no technical detail is ever
/// shown to the reader, so nothing from it is rendered.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <header className="surface-band">
        <div className="mx-auto flex max-w-(--width-page-max) flex-col items-center px-space-4 py-space-6">
          <Link href="/" className="text-wordmark text-[42px] text-ink no-underline md:text-[56px]">
            Today News
            <span className="text-brand" aria-hidden="true">
              .
            </span>
          </Link>
        </div>
        <div className="border-b-2 border-brand" />
      </header>
      <main id="content" className="mx-auto max-w-(--width-measure) px-space-4 py-space-10 text-center md:px-space-5">
        <p className="text-label text-brand">Temporarily unavailable</p>
        <h1 className="mt-space-3 text-display-2 text-ink">Something went wrong on our side</h1>
        <p className="mx-auto mt-space-4 max-w-[46ch] text-standfirst text-ink-secondary">
          We&rsquo;re sorry — please try again in a moment.
        </p>
        <div className="mt-space-6 flex flex-col items-center justify-center gap-y-space-3 sm:flex-row sm:gap-x-space-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center rounded-pill bg-ink px-space-5 text-meta text-paper transition-[background-color,transform] duration-(--duration-fast) hover:bg-ink-secondary active:translate-y-px"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-pill border border-ink px-space-5 text-meta text-ink no-underline transition-[background-color,color] duration-(--duration-fast) hover:bg-ink hover:text-paper"
          >
            Back to the front page
          </Link>
        </div>
      </main>
    </>
  );
}
