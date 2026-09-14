import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";
import { getCategories, getPublishedArticlesOrEmpty } from "@/lib/api/public";
import { StoryCard } from "@/components/public/StoryCard";
import { SectionHeading } from "@/components/public/SectionHeading";
import { PulseLine } from "@/components/brand/PulseLine";
import { TextReveal } from "@/components/motion/TextReveal";

/// 2h — "That story isn't here." A big red 404, a plain sentence, the
/// front page and the first section as routes onward, then the newest
/// stories. Next renders this for both notFound() calls and unmatched
/// routes, with a real 404 status.
///
/// SEC-03 — this is the ONE component rendered for every "doesn't
/// exist" case: a mistyped address, a story that was never published,
/// and a withdrawn story all reach this exact same page.
export default async function NotFound() {
  const [{ articles }, categories] = await Promise.all([getPublishedArticlesOrEmpty(), getCategories()]);
  const latest = articles.slice(0, 3);
  const firstSection = categories[0];

  return (
    <PublicSite>
      <PublicHeader showPulse={false} />
      <main id="content" className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-8 md:px-space-6 md:pt-space-9">
        <div className="max-w-(--width-measure)">
          <p className="text-mono text-ink-muted">404</p>
          <p className="mt-space-3 text-[64px] font-extrabold leading-none tracking-[-0.04em] text-brand md:text-[88px]" aria-hidden="true">
            404
          </p>
          <PulseLine width={180} color="var(--color-brand)" draw beat className="mt-space-2" />
          <TextReveal as="h1" text="That story isn’t here." className="mt-space-4 text-heading-1 text-ink" />
          <p className="mt-space-3 max-w-[52ch] text-body text-ink-secondary">
            It may have been withdrawn, or the address may be wrong. Either way, the newsroom is still working.
          </p>
          <div className="mt-space-5 flex flex-wrap gap-space-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center bg-brand px-space-4 text-body-sm font-medium text-paper no-underline transition-colors hover:bg-brand-deep"
            >
              Front page
            </Link>
            {firstSection ? (
              <Link
                href={`/${firstSection.slug}`}
                className="inline-flex h-10 items-center border border-ink bg-paper px-space-4 text-body-sm text-ink no-underline transition-colors hover:bg-ink hover:text-paper"
              >
                Latest in {firstSection.name}
              </Link>
            ) : null}
          </div>
        </div>

        {latest.length > 0 ? (
          <section aria-labelledby="nf-latest" className="mt-space-9">
            <SectionHeading id="nf-latest" title="Meanwhile, the latest" tone="brand" />
            <div className="mt-space-4 grid grid-cols-1 gap-x-space-5 gap-y-space-5 sm:grid-cols-3">
              {latest.map((article) => (
                <StoryCard key={article.slug} article={article} variant="standard" />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <PublicFooter />
    </PublicSite>
  );
}
