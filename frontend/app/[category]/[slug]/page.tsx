import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ViewTransition } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ArticleHeader } from "@/components/public/ArticleHeader";
import { ArticleBody } from "@/components/public/ArticleBody";
import { SourcesBlock } from "@/components/public/SourcesBlock";
import { MoreInSection } from "@/components/public/MoreInSection";
import { getPublishedArticle } from "@/lib/api/public";
import { estimateReadingMinutes } from "@/lib/reading-time";
import { SITE_NAME } from "@/lib/site";

type PageParams = { category: string; slug: string };

/// PG-PUB-03 — "the most important page in the product" (docs/12).
/// docs/08 §0: most readers land here directly from a search engine,
/// never seeing the homepage — the page must stand alone. Priority order
/// fixed by docs/08 §4: headline -> picture -> story -> everything else.
export default async function ArticlePage({ params }: { params: Promise<PageParams> }) {
  const { category: categorySlug, slug } = await params;
  const article = await getPublishedArticle(categorySlug, slug);
  // SEC-03 — a wrong slug, a never-published story and a withdrawn story
  // must all reach this exact same notFound() call. There is no separate
  // code path here that could diverge and leak which case it was.
  if (!article) {
    notFound();
  }

  const readingMinutes = estimateReadingMinutes(article.body, article.summary);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    description: article.summary,
    datePublished: article.publishedAt,
    author: { "@type": "Person", name: article.byline },
    publisher: { "@type": "Organization", name: SITE_NAME },
    image: article.featuredImage ? [article.featuredImage.url] : undefined,
  };

  return (
    <>
      {/* SEO-05 — NewsArticle structured data, built from the same
          response already fetched above; no second request. */}
      <script
        type="application/ld+json"
        // JSON.stringify of a fixed-shape object we constructed above, not
        // user-supplied markup. This is the one narrow, documented
        // exception: DM-08 bans
        // dangerouslySetInnerHTML for ARTICLE BODY content specifically
        // (contributor-supplied text rendered as markup); this is
        // machine-readable JSON metadata we built ourselves, required by
        // SEO-05, and is the standard way to emit JSON-LD in Next.js.
        // `<` is escaped so a headline/byline containing "</script>"
        // can't break out of the tag — defensive, even though this is
        // staff-authored content, not attacker-controlled reader input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PublicHeader activeCategorySlug={article.category.slug} showLatest={false} />
      <div className="reading-progress" aria-hidden="true" />
      <ViewTransition default="page-fade">
        <main>
          <article>
            <ArticleHeader article={article} readingMinutes={readingMinutes} />
            <div className="mx-auto max-w-(--width-measure) px-space-4 pt-space-7 md:px-space-5 md:pt-space-8">
              <ArticleBody body={article.body} />
              <SourcesBlock sources={article.sources} />
            </div>
          </article>
          <div className="mx-auto max-w-(--width-page-max) px-space-4 md:px-space-5">
            <MoreInSection categorySlug={article.category.slug} excludeSlug={article.slug} />
          </div>
        </main>
      </ViewTransition>
      <PublicFooter />
    </>
  );
}

/// SEO-03/SEO-04 — per-article title/description, falling back to
/// headline/summary; OG image for link previews (docs/08 R-03).
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const article = await getPublishedArticle(categorySlug, slug);
  if (!article) return {};

  const title = article.seoTitle ?? article.headline;
  const description = article.seoDescription ?? article.summary;

  return {
    title: `${title} — ${SITE_NAME}`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.publishedAt,
      images: article.featuredImage ? [{ url: article.featuredImage.url }] : undefined,
    },
  };
}
