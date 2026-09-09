import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

/// PG-PUB-09. docs/08 E-01: a clear message, the normal masthead and
/// navigation, and a route back — never a dead end. Next.js renders this
/// for both notFound() calls and any genuinely unmatched route, and
/// correctly emits a 404 status (SEO-10) automatically.
///
/// SEC-03 — this is the ONE component rendered for every "doesn't exist"
/// case: a mistyped address, a story that was never published, and a
/// withdrawn story all reach this exact same page, with nothing in the
/// response that could tell them apart.
export default async function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-(--width-measure) px-space-4 py-space-10 text-center md:px-space-5">
        <h1 className="text-heading-2 text-ink">We can&rsquo;t find that page</h1>
        <p className="mt-space-3 text-body text-ink-secondary">
          The address may be mistyped, or the page may no longer exist.
        </p>
        <Link href="/" className="mt-space-5 inline-block text-body text-accent underline">
          Back to the homepage
        </Link>
      </main>
      <PublicFooter />
    </>
  );
}
