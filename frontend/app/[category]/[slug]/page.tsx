import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ArticleMeta } from "@/components/public/ArticleMeta";
import { ArticleBody } from "@/components/public/ArticleBody";
import { SourcesBlock } from "@/components/public/SourcesBlock";
import { MoreInSection } from "@/components/public/MoreInSection";
import { getPublishedArticle } from "@/lib/api/public";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    description: article.summary,
    datePublished: article.publishedAt,
    author: { "@type": "Person", name: article.byline },
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
      <PublicHeader activeCategorySlug={article.category.slug} />
      <main className="mx-auto max-w-(--width-measure-wide) px-space-4 py-space-6 md:px-space-5">
        <p className="text-label text-ink-muted">{article.category.name}</p>
        <h1 className="mt-space-3 text-display-1 text-ink">{article.headline}</h1>
        <p className="mt-space-4 text-standfirst text-ink-secondary">{article.summary}</p>
        <div className="mt-space-4">
          <ArticleMeta byline={article.byline} category={article.category} publishedAt={article.publishedAt} />
        </div>

        {article.featuredImage ? (
          <figure className="mt-space-6">
            <div className="relative aspect-3/2 bg-surface-sunken">
              <Image
                src={article.featuredImage.url}
                alt={article.featuredImage.alt}
                fill
                priority
                className="object-cover"
              />
            </div>
            {article.featuredImage.caption || article.featuredImage.credit ? (
              <figcaption className="mt-space-2 text-caption text-ink-muted">
                {article.featuredImage.caption}
                {article.featuredImage.caption && article.featuredImage.credit ? " — " : ""}
                {article.featuredImage.credit}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="mx-auto mt-space-6 max-w-(--width-measure)">
          <ArticleBody body={article.body} />
          <SourcesBlock sources={article.sources} />
        </div>
      </main>
      <div className="mx-auto max-w-(--width-measure-wide) px-space-4 md:px-space-5">
        <MoreInSection categorySlug={article.category.slug} excludeSlug={article.slug} />
      </div>
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
    title: `${title} — Today News`,
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
