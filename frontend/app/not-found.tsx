import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { getPublishedArticles } from "@/lib/api/public";
import { StoryCard } from "@/components/public/StoryCard";
import { SectionHeading } from "@/components/public/SectionHeading";

/// PG-PUB-09. docs/08 E-01: a clear message, the normal masthead and
/// navigation, and a route back — never a dead end. Next.js renders this
/// for both notFound() calls and any genuinely unmatched route, and
/// correctly emits a 404 status (SEO-10) automatically. Per brief §22 it
/// also offers the newest stories, so the reader is back inside the
/// publication in one click.
///
/// SEC-03 — this is the ONE component rendered for every "doesn't exist"
/// case: a mistyped address, a story that was never published, and a
/// withdrawn story all reach this exact same page, with nothing in the
/// response that could tell them apart.
export default async function NotFound() {
  const { articles } = await getPublishedArticles();
  const latest = articles.slice(0, 3);

  return (
    <>
      <PublicHeader showLatest={false} />
      <main className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-8 md:px-space-5 md:pt-space-9">
        <div className="mx-auto max-w-(--width-measure) text-center">
          <p className="text-numeral text-brand" aria-hidden="true">
            404
          </p>
          <h1 className="mt-space-4 text-display-2 text-ink">We can&rsquo;t find that page</h1>
          <p className="mx-auto mt-space-4 max-w-[46ch] text-standfirst text-ink-secondary">
            The address may be mistyped, or the page may no longer exist.
          </p>
          <Link
            href="/"
            className="mt-space-6 inline-flex h-11 items-center rounded-pill border border-ink px-space-5 text-meta text-ink no-underline transition-[background-color,color] duration-(--duration-fast) hover:bg-ink hover:text-paper"
          >
            Back to the front page
          </Link>
        </div>

        {latest.length > 0 ? (
          <section aria-labelledby="nf-latest" className="mt-space-9">
            <SectionHeading id="nf-latest" title="Meanwhile, the latest" tone="brand" live />
            <div className="mt-space-5 grid grid-cols-1 gap-x-space-6 gap-y-space-6 sm:grid-cols-2 md:grid-cols-3">
              {latest.map((article) => (
                <StoryCard key={article.slug} article={article} variant="standard" showSummary={false} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <PublicFooter />
    </>
  );
}
