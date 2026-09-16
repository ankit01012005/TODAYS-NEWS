import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ViewTransition } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";
import { StoryCard } from "@/components/public/StoryCard";
import { LoadMoreList } from "@/components/public/LoadMoreList";
import { EmptyState } from "@/components/public/EmptyState";
import { getCategoryWithArticles } from "@/lib/api/public";
import { TextReveal } from "@/components/motion/TextReveal";

type PageProps = {
  params: Promise<{ category: string }>;
};

/// 1e — the section page: a big Archivo 800 section name over the 56px
/// red underline, then list rows at 150×100 thumbs, newest first, and a
/// Load more driven by the API's keyset cursor. A section with nothing
/// published is a normal state, not a failure — never a blank page.
export default async function CategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const result = await getCategoryWithArticles(categorySlug);
  if (!result) {
    notFound();
  }

  const [lead, ...rest] = result.articles;

  return (
    <PublicSite>
      <PublicHeader activeCategorySlug={result.category.slug} />
      <ViewTransition default="page-fade">
        <main id="content" className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-6 md:px-space-6 md:pt-space-7">
          <header>
            <TextReveal as="h1" text={result.category.name} className="text-display-0 text-ink" />
            <div className="section-underline mt-space-3" aria-hidden="true" />
            <p className="mt-space-4 max-w-[60ch] text-body text-ink-secondary">
              The newest reporting from the {result.category.name} desk, reviewed by an editor before it was published.
            </p>
          </header>

          {lead ? (
            <div className="mt-space-6 grid grid-cols-1 gap-x-space-8 md:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <StoryCard article={lead} variant="lead" preload headingLevel={2} />
                <div className="reveal-stagger mt-space-6 divide-y divide-rule border-t border-rule">
                  {rest.map((article) => (
                    <StoryCard key={article.slug} article={article} variant="row" morph className="reveal py-space-4" />
                  ))}
                </div>
                <LoadMoreList
                  categorySlug={result.category.slug}
                  initialCursor={result.nextCursor}
                  variant="row"
                  exclude={result.articles.map((a) => a.slug)}
                />
              </div>
              <aside className="hidden md:block">
                <div className="sticky top-16 border-t-2 border-ink pt-space-3">
                  <p className="text-label-lg text-ink">About this desk</p>
                  <p className="mt-space-3 text-body-sm text-ink-secondary">
                    Every story here carries the section in its address — <span className="text-mono text-ink">/{result.category.slug}/…</span> —
                    and that address never changes once a story is published.
                  </p>
                </div>
              </aside>
            </div>
          ) : (
            <div className="mt-space-6">
              <EmptyState
                heading={`No ${result.category.name} coverage yet`}
                body={`Nothing has been published in ${result.category.name} so far. The rest of the site is waiting.`}
                action={{ href: "/", label: "Read the front page" }}
              />
            </div>
          )}
        </main>
      </ViewTransition>
      <PublicFooter />
    </PublicSite>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const result = await getCategoryWithArticles(categorySlug);
  // Thrown here, before the loading boundary streams, so an unknown
  // section answers with a real 404 status — not a 200 with a 404 page.
  if (!result) notFound();
  return { title: result.category.name };
}
