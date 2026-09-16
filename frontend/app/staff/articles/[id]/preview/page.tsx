import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Alert } from "@/components/cms/Alert";
import { PreviewShell } from "@/components/cms/PreviewShell";
import { ArticleBody } from "@/components/public/ArticleBody";
import { ArticleMeta } from "@/components/public/ArticleMeta";
import { SourcesBlock } from "@/components/public/SourcesBlock";
import { requireSession } from "@/lib/api/session";
import { getArticle, getArticleSources, listCategoriesForStaff, listMedia } from "@/lib/api/cms";
import { estimateReadingMinutes } from "@/lib/reading-time";

export const metadata: Metadata = { title: "Preview", robots: { index: false } };

/// 2k — exactly what readers get: the same ArticleBody / ArticleMeta /
/// SourcesBlock the public article page renders with, fed by a thin
/// adapter from the private RevisionView shape. Truthful by construction.
/// The red band is the only difference — it must be impossible to
/// mistake this for the live site. Reachable only with a session and
/// the same ownership check getArticle's backend call already enforces.
export default async function ArticlePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSession();
  const article = await getArticle(id);
  if (!article) notFound();

  const [categories, attachedSources, media] = await Promise.all([
    listCategoriesForStaff(),
    getArticleSources(id),
    listMedia(),
  ]);

  const revision = article.openRevision ?? article.publishedRevision;
  const categoryId = revision?.categoryId ?? article.categoryId;
  const category = categories.find((c) => c.id === categoryId) ?? { name: "Uncategorised", slug: "" };
  const byline = revision?.bylineOverride ?? article.bylineOverride ?? user.displayName;
  const sources = attachedSources
    .filter((s) => s.isPublic)
    .map((s) => ({ name: s.source.name, note: s.note, url: s.source.url, verified: s.source.verified }));
  const featuredAsset = revision?.featuredImageId ? (media.find((m) => m.id === revision.featuredImageId) ?? null) : null;
  const readingMinutes = revision ? estimateReadingMinutes(revision.body, revision.summary ?? "") : 1;
  const isLiveRevision = article.publicationStatus === "LIVE" && !article.openRevision;

  return (
    <PreviewShell
      label={isLiveRevision ? "Preview · this is the live version" : "Preview · not published"}
      backHref={`/staff/articles/${article.id}/edit`}
    >
      <main className="public-site mx-auto max-w-(--width-measure-wide) bg-surface px-space-4 py-space-6 md:px-space-6">
        {!revision ? (
          <Alert variant="info" title="Nothing to preview yet">
            This story has no content.
          </Alert>
        ) : (
          <article>
            <div className="h-[2px] w-[38%] bg-brand" aria-hidden="true" />
            <p className="mt-space-4 text-caption text-ink-muted">
              Home <span className="text-brand">›</span> {category.name} <span className="text-brand">›</span> story
            </p>
            <h1 className="article-title mt-space-3 text-ink">{revision.headline || "Untitled"}</h1>
            <p className="mt-space-4 max-w-[64ch] text-standfirst text-ink-secondary">{revision.summary}</p>
            <div className="mt-space-5">
              <ArticleMeta
                byline={byline}
                category={category}
                publishedAt={revision.publishedAt ?? new Date().toISOString()}
                hypothetical={!revision.publishedAt}
                readingMinutes={readingMinutes}
              />
            </div>

            {featuredAsset ? (
              <figure className="mt-space-5">
                <div className="relative aspect-3/2 overflow-hidden bg-surface-deep">
                  <Image
                    src={featuredAsset.url}
                    alt={revision.featuredImageAlt ?? ""}
                    fill
                    preload
                    sizes="(min-width: 900px) 820px, 100vw"
                    className="object-cover"
                  />
                </div>
                {revision.featuredImageCaption || revision.featuredImageCredit ? (
                  <figcaption className="mt-space-2 text-caption text-ink-muted">
                    {revision.featuredImageCaption}
                    {revision.featuredImageCaption && revision.featuredImageCredit ? " · " : ""}
                    {revision.featuredImageCredit}
                  </figcaption>
                ) : null}
                {!revision.featuredImageAlt ? (
                  <p className="mt-space-2 border-l-[3px] border-danger pl-space-2 text-caption text-danger">
                    No alt text yet — the story can’t be submitted until the lead image has one.
                  </p>
                ) : null}
              </figure>
            ) : null}

            <div className="mx-auto mt-space-6 max-w-(--width-measure)">
              <ArticleBody body={revision.body} />
              <SourcesBlock sources={sources} />
            </div>
          </article>
        )}
      </main>
    </PreviewShell>
  );
}
