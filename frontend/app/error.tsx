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
    <main className="mx-auto max-w-(--width-measure) px-space-4 py-space-10 text-center md:px-space-5">
      <p className="text-heading-2 text-ink">Today News</p>
      <h1 className="mt-space-5 text-heading-3 text-ink">Something went wrong on our side</h1>
      <p className="mt-space-3 text-body text-ink-secondary">
        We&rsquo;re sorry — please try again in a moment.
      </p>
      <div className="mt-space-5 flex justify-center gap-x-space-5">
        <button
          type="button"
          onClick={() => reset()}
          className="text-body text-accent underline"
        >
          Try again
        </button>
        <Link href="/" className="text-body text-accent underline">
          Back to the homepage
        </Link>
      </div>
    </main>
  );
}
