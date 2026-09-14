import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ViewTransition } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";
import { ArticleHeader } from "@/components/public/ArticleHeader";
import { ArticleBody } from "@/components/public/ArticleBody";
import { SourcesBlock } from "@/components/public/SourcesBlock";
import { MoreInSection } from "@/components/public/MoreInSection";
import { MobileShareBar } from "@/components/public/ShareButton";
import { getPublishedArticle } from "@/lib/api/public";
import { estimateReadingMinutes } from "@/lib/reading-time";
import { SITE_NAME } from "@/lib/site";
import { absoluteUrl } from "@/lib/site-url";

type PageParams = { category: string; slug: string };

/// 1d — the article page, the most important page in the product. Most
/// readers land here from a search engine or a handle, never seeing the
/// front page — the page must stand alone. Priority order: headline →
/// picture → story → everything else. On a phone the WhatsApp / Copy
/// link bar sticks to the foot of the story (1g).
export default async function ArticlePage({ params }: { params: Promise<PageParams> }) {
  const { category: categorySlug, slug } = await params;
  const article = await getPublishedArticle(categorySlug, slug);
  // SEC-03 — a wrong slug, a never-published story and a withdrawn story
  // must all reach this exact same notFound() call.
  if (!article) {
    notFound();
  }

  const readingMinutes = estimateReadingMinutes(article.body, article.summary);
  const url = absoluteUrl(`/${article.category.slug}/${article.slug}`);

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
    <PublicSite>
      {/* NewsArticle structured data, built from the same response already
          fetched above. JSON.stringify of a fixed-shape object we
          constructed — not user-supplied markup; `<` is escaped so a
          headline containing "</script>" can't break out of the tag. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PublicHeader activeCategorySlug={article.category.slug} showPulse={false} />
      <div className="reading-progress" aria-hidden="true" />
      <ViewTransition default="page-fade">
        <main id="content" className="pt-space-5 md:pt-space-6">
          <article>
            <ArticleHeader article={article} readingMinutes={readingMinutes} />
            <div className="mx-auto max-w-(--width-measure) px-space-4 pt-space-6 md:px-space-6 md:pt-space-7">
              <ArticleBody body={article.body} />
              <SourcesBlock sources={article.sources} />
            </div>
          </article>
          <div className="mx-auto max-w-(--width-measure-wide) px-space-4 md:px-space-6">
            <MoreInSection categorySlug={article.category.slug} excludeSlug={article.slug} />
          </div>
          <MobileShareBar title={article.headline} url={url} />
        </main>
      </ViewTransition>
      <PublicFooter />
    </PublicSite>
  );
}

/// Per-article title/description, falling back to headline/summary; OG
/// image for link previews on the handles.
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const article = await getPublishedArticle(categorySlug, slug);
  // Thrown here, before the loading boundary streams, so a withdrawn or
  // unknown story answers with a real 404 status (SEO-10 / SEC-03).
  if (!article) notFound();

  const title = article.seoTitle ?? article.headline;
  const description = article.seoDescription ?? article.summary;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: SITE_NAME,
      publishedTime: article.publishedAt,
      images: article.featuredImage ? [{ url: article.featuredImage.url, alt: article.featuredImage.alt }] : undefined,
    },
    twitter: {
      card: article.featuredImage ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}
