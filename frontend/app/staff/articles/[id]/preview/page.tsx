import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/cms/Alert";
import { ArticleBody } from "@/components/public/ArticleBody";
import { ArticleMeta } from "@/components/public/ArticleMeta";
import { SourcesBlock } from "@/components/public/SourcesBlock";
import { requireSession } from "@/lib/api/session";
import { getArticle, getArticleSources, listCategoriesForStaff, listMedia } from "@/lib/api/cms";
import { mediaUrl } from "@/lib/api/media-url";

export const metadata: Metadata = { title: "Preview — Today News", robots: { index: false } };

/// docs/09's "the story as a reader would see it" — reuses the exact same
/// ArticleBody/ArticleMeta/SourcesBlock components the public article
/// page (5B) renders with, fed by a thin adapter from the private
/// RevisionView shape. Truthful by construction, not by a second,
/// divergent implementation. No separate guessable address — reachable
/// only via requireSession() + the same ownership check getArticle's
/// backend call already enforces (P2-07).
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
  const category = categories.find((c) => c.id === article.categoryId) ?? { name: "Uncategorized", slug: "" };
  const byline = article.bylineOverride ?? user.displayName;
  const sources = attachedSources.filter((s) => s.isPublic).map((s) => ({ name: s.source.name, note: s.note }));
  const featuredAsset = revision?.featuredImageId ? (media.find((m) => m.id === revision.featuredImageId) ?? null) : null;

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-attention bg-attention-wash px-space-4 py-space-2 text-center text-body-sm text-ink">
        Preview only — not published.{" "}
        <Link href={`/staff/articles/${article.id}/edit`} className="underline">
          Back to editor
        </Link>
      </div>
      <main className="mx-auto max-w-(--width-measure-wide) bg-paper px-space-4 py-space-6 md:px-space-5">
        {!revision ? (
          <Alert variant="info" title="Nothing to preview yet">
            This story has no content.
          </Alert>
        ) : (
          <>
            <p className="text-label text-ink-muted">{category.name}</p>
            <h1 className="mt-space-3 text-display-1 text-ink">{revision.headline || "Untitled"}</h1>
            <p className="mt-space-4 text-standfirst text-ink-secondary">{revision.summary}</p>
            <div className="mt-space-4">
              <ArticleMeta byline={byline} category={category} publishedAt={revision.publishedAt ?? revision.createdAt} />
            </div>

            {featuredAsset && revision.featuredImageAlt ? (
              <figure className="mt-space-6">
                <div className="relative aspect-3/2 bg-surface-sunken">
                  <Image
                    src={mediaUrl(featuredAsset.storageKey)}
                    alt={revision.featuredImageAlt}
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
                {revision.featuredImageCaption || revision.featuredImageCredit ? (
                  <figcaption className="mt-space-2 text-caption text-ink-muted">
                    {revision.featuredImageCaption}
                    {revision.featuredImageCaption && revision.featuredImageCredit ? " — " : ""}
                    {revision.featuredImageCredit}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}

            <div className="mx-auto mt-space-6 max-w-(--width-measure)">
              <ArticleBody body={revision.body} />
              <SourcesBlock sources={sources} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
