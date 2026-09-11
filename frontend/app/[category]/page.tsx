import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ViewTransition } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { StoryCard } from "@/components/public/StoryCard";
import { EmptyState } from "@/components/public/EmptyState";
import { getCategoryWithArticles } from "@/lib/api/public";
import { SITE_NAME } from "@/lib/site";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ cursor?: string }>;
};

/// PG-PUB-02 — docs/08 R-04: behaves as the homepage, filtered to one
/// section, with its own composition (brief §8): a section opener, the
/// newest story as a feature beside two typography stories, then the
/// rest as a grid. Older pages come from the API's keyset cursor
/// (public.service.ts) via ?cursor=. E-03: a section with nothing
/// published is a normal state, not a failure — never a blank page.
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ category: categorySlug }, { cursor }] = await Promise.all([params, searchParams]);
  const result = await getCategoryWithArticles(categorySlug, cursor);
  if (!result) {
    notFound();
  }

  const [lead, ...rest] = result.articles;
  const secondary = rest.slice(0, 2);
  const grid = rest.slice(2);
  const isFirstPage = !cursor;

  return (
    <>
      <PublicHeader activeCategorySlug={result.category.slug} />
      <ViewTransition default="page-fade">
        <main className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-6 md:px-space-5 md:pt-space-7">
          <header className="border-b-2 border-ink pb-space-4">
            <p className="text-label text-brand">Section</p>
            <h1 className="mt-space-1 text-display-1 text-ink">{result.category.name}</h1>
            {!isFirstPage ? (
              <p className="mt-space-2 text-meta text-ink-muted">
                Older stories ·{" "}
                <Link href={`/${result.category.slug}`} className="link-underline text-ink-secondary">
                  Back to the newest
                </Link>
              </p>
            ) : null}
          </header>

          {lead ? (
            <>
              <div className="mt-space-6 grid grid-cols-1 gap-y-space-6 md:grid-cols-12 md:gap-x-space-6">
                <StoryCard article={lead} variant="feature" morph preload className="md:col-span-8" />
                {secondary.length > 0 ? (
                  <div className="divide-y divide-rule md:col-span-4 md:border-l md:border-rule md:pl-space-6">
                    {secondary.map((article) => (
                      <StoryCard
                        key={article.slug}
                        article={article}
                        variant="text"
                        className="py-space-5 first:pt-0"
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              {grid.length > 0 ? (
                <div className="reveal-stagger mt-space-8 grid grid-cols-1 gap-x-space-6 gap-y-space-7 border-t border-rule pt-space-6 sm:grid-cols-2 md:grid-cols-3">
                  {grid.map((article) => (
                    <StoryCard
                      key={article.slug}
                      article={article}
                      variant="standard"
                      morph
                      className="reveal"
                    />
                  ))}
                </div>
              ) : null}

              {result.nextCursor ? (
                <nav aria-label="Older stories" className="mt-space-8 flex justify-center border-t border-rule pt-space-6">
                  <Link
                    href={`/${result.category.slug}?cursor=${encodeURIComponent(result.nextCursor)}`}
                    className="inline-flex h-11 items-center gap-x-space-2 rounded-pill border border-ink px-space-5 text-meta text-ink no-underline transition-[background-color,color] duration-(--duration-fast) hover:bg-ink hover:text-paper"
                  >
                    Older stories <span aria-hidden="true">→</span>
                  </Link>
                </nav>
              ) : null}
            </>
          ) : (
            <div className="mt-space-6">
              <EmptyState
                heading={`No ${result.category.name} coverage yet`}
                body={`Nothing has been published in ${result.category.name} so far. The rest of the paper is waiting.`}
                action={{ href: "/", label: "Read the front page" }}
              />
            </div>
          )}
        </main>
      </ViewTransition>
      <PublicFooter />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const result = await getCategoryWithArticles(categorySlug);
  if (!result) return {};
  return { title: `${result.category.name} — ${SITE_NAME}` };
}
