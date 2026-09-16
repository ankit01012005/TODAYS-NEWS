import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { Search } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";
import { StoryCard } from "@/components/public/StoryCard";
import { getCategories } from "@/lib/api/public";
import { searchPublished } from "@/lib/search";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

type SearchParams = Promise<{ q?: string; section?: string; sort?: string }>;

/// 2f — results and the empty case. A plain GET form (works without
/// JavaScript, and the address is shareable), a section filter and a
/// newest/relevance sort, results as thumbnail rows, and — for no
/// matches — the exact phrase quoted back with two sections to browse.
export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", section = "", sort = "relevance" } = await searchParams;
  const query = q.trim().slice(0, 120);
  const [categories, result] = await Promise.all([getCategories(), query ? searchPublished(query) : null]);

  let articles = result?.articles ?? [];
  if (section) articles = articles.filter((a) => a.category.slug === section);
  if (sort === "newest") articles = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const browse = categories.slice(0, 2);

  return (
    <PublicSite>
      <PublicHeader showPulse={false} activePath="/search" />
      <ViewTransition default="page-fade">
        <main id="content" className="mx-auto max-w-(--width-measure-wide) px-space-4 pt-space-6 md:px-space-6 md:pt-space-7">
          <h1 className="text-label-lg text-brand">Search</h1>
          <form action="/search" method="get" role="search" className="mt-space-3">
            <div className="flex border border-ink bg-paper focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
              <label htmlFor="q" className="sr-only">
                Search stories
              </label>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search headlines, summaries, bylines…"
                autoFocus={!query}
                className="h-12 min-w-0 flex-1 bg-transparent px-space-4 text-body text-ink placeholder:text-ink-faint focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center gap-x-space-2 bg-brand px-space-5 text-body-sm font-medium text-paper transition-colors hover:bg-brand-deep"
              >
                <Search size={15} aria-hidden="true" />
                Search
              </button>
            </div>
            {query ? (
              <div className="mt-space-3 flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
                <p className="text-mono text-ink-muted" aria-live="polite">
                  {articles.length} result{articles.length === 1 ? "" : "s"}
                  {result?.truncated ? " · newest stories only" : ""}
                </p>
                <label className="inline-flex h-7 items-center rounded-pill border border-rule-strong pl-space-3 text-caption text-ink">
                  <span className="sr-only">Section</span>
                  <select name="section" defaultValue={section} className="h-full bg-transparent pr-space-2 text-caption focus:outline-none">
                    <option value="">All sections</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex h-7 items-center rounded-pill border border-rule-strong pl-space-3 text-caption text-ink">
                  <span className="sr-only">Sort</span>
                  <select name="sort" defaultValue={sort} className="h-full bg-transparent pr-space-2 text-caption focus:outline-none">
                    <option value="relevance">Most relevant</option>
                    <option value="newest">Newest</option>
                  </select>
                </label>
                <button type="submit" className="text-caption text-ink-secondary underline decoration-brand/60 underline-offset-4">
                  Apply
                </button>
              </div>
            ) : null}
          </form>

          {query ? (
            articles.length > 0 ? (
              <ol className="reveal-stagger mt-space-5 divide-y divide-rule border-t border-rule">
                {articles.map((article) => (
                  <li key={article.slug} className="reveal">
                    <StoryCard article={article} variant="row" className="py-space-4" />
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-space-6 border border-dashed border-rule-strong p-space-6 text-center">
                <p className="text-heading-4 text-ink">Nothing matched &ldquo;{query}&rdquo;.</p>
                <p className="mt-space-2 text-body-sm text-ink-secondary">
                  Try fewer words
                  {browse.length > 0 ? (
                    <>
                      , or browse{" "}
                      {browse.map((c, i) => (
                        <span key={c.slug}>
                          <Link href={`/${c.slug}`} className="text-brand underline decoration-brand/50 underline-offset-4">
                            {c.name}
                          </Link>
                          {i < browse.length - 1 ? " and " : ""}
                        </span>
                      ))}
                    </>
                  ) : null}
                  .
                </p>
              </div>
            )
          ) : (
            <div className="mt-space-6">
              <p className="text-body text-ink-secondary">
                Search every published story by headline, summary or byline.
              </p>
              {categories.length > 0 ? (
                <ul className="mt-space-4 flex flex-wrap gap-space-2">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/${c.slug}`}
                        className="inline-flex h-8 items-center rounded-pill border border-rule-strong px-space-3 text-caption text-ink no-underline transition-colors hover:border-ink"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </main>
      </ViewTransition>
      <PublicFooter />
    </PublicSite>
  );
}
