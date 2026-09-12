import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/CmsShell";
import { ArticleReviewActions } from "@/components/cms/ArticleReviewActions";
import { FeedbackPanel } from "@/components/cms/FeedbackPanel";
import { ArticleBody } from "@/components/public/ArticleBody";
import { requireRole } from "@/lib/api/session";
import { getArticle, getArticleSources, getRevisionHistory, listCategoriesForStaff, listMedia } from "@/lib/api/cms";
import { formatDateTime } from "@/lib/format-date";

export const metadata: Metadata = { title: "Review article — Today News", robots: { index: false } };

/// PG-ADM-03 — "the complete story as a reader would see it" (ArticleBody,
/// the same renderer the public site and the editor's preview use — true
/// by construction, not a second implementation), plus what a reader
/// wouldn't see: author, submitted time, section, sources, picture
/// credit, and previous feedback (FeedbackPanel, reused from 5C).
export default async function ArticleReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("ADMIN");
  const article = await getArticle(id);
  // Nothing to decide if it isn't actually awaiting a decision — a stale
  // link (already decided by another admin, or never existed) gets the
  // same clean 404 either way.
  if (!article || !article.openRevision || article.openRevision.state !== "IN_REVIEW") {
    notFound();
  }
  const revision = article.openRevision;

  const [categories, attachedSources, media, history] = await Promise.all([
    listCategoriesForStaff(),
    getArticleSources(id),
    listMedia(),
    getRevisionHistory(id),
  ]);

  // What the admin is approving includes the section (docs/27 A1) — show
  // the revision's, and flag when it differs from what is live today.
  const category = categories.find((c) => c.id === revision.categoryId) ?? { name: "Uncategorized", slug: "" };
  const liveCategory = categories.find((c) => c.id === article.categoryId) ?? null;
  const sectionChanges = article.publicationStatus === "LIVE" && revision.categoryId !== article.categoryId;
  const featuredAsset = revision.featuredImageId ? (media.find((m) => m.id === revision.featuredImageId) ?? null) : null;
  const canApprove = article.ownerId !== user.id && revision.createdByUserId !== user.id;

  return (
    <CmsShell user={user}>
      <div className="mx-auto max-w-(--width-measure-wide)">
        <div className="flex flex-wrap items-center justify-between gap-x-space-4 gap-y-space-1">
          <h1 className="text-heading-2 text-ink">Review</h1>
          <div className="flex items-center gap-x-space-4 text-body-sm text-ink-muted">
            <span>/{article.slug}</span>
            <span>Submitted {revision.submittedAt ? formatDateTime(revision.submittedAt) : "—"}</span>
            <Link href={`/staff/articles/${article.id}/history`} className="text-accent underline">
              History
            </Link>
            <Link href={`/staff/articles/${article.id}/edit`} className="text-accent underline">
              Edit it myself
            </Link>
          </div>
        </div>

        <FeedbackPanel history={history} />

        <article className="mt-space-6 rounded-md border border-rule bg-paper p-space-5">
          <p className="text-label text-ink-muted">
            {category.name}
            {sectionChanges ? (
              <span className="ml-space-2 rounded-sm bg-attention-wash px-space-2 py-0.5 text-meta text-ink">
                moves from {liveCategory?.name ?? "its current section"} on publish
              </span>
            ) : null}
          </p>
          <h2 className="mt-space-2 text-heading-1 text-ink">{revision.headline || "Untitled"}</h2>
          <p className="mt-space-3 text-standfirst text-ink-secondary">{revision.summary}</p>

          {featuredAsset ? (
            <figure className="mt-space-5">
              <div className="relative aspect-3/2 bg-surface-sunken">
                <Image
                  src={featuredAsset.url}
                  alt={revision.featuredImageAlt ?? ""}
                  fill
                  className="object-cover"
                />
              </div>
              {revision.featuredImageCredit ? (
                <figcaption className="mt-space-1 text-caption text-ink-muted">
                  Picture credit: {revision.featuredImageCredit}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <div className="mx-auto mt-space-6 max-w-(--width-measure)">
            <ArticleBody body={revision.body} />
          </div>

          <div className="mt-space-6 border-t border-rule pt-space-4">
            <h3 className="text-label text-ink-muted">Sources</h3>
            {attachedSources.length > 0 ? (
              <ul className="mt-space-2 space-y-space-1">
                {attachedSources.map((s) => (
                  <li key={s.id} className="text-body-sm text-ink-secondary">
                    {s.source.name}
                    {s.source.verified ? " ✓" : ""}
                    {s.note ? ` — ${s.note}` : ""}
                    {!s.isPublic ? <span className="text-ink-faint"> (internal only)</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-space-2 text-body-sm text-ink-muted">No sources attached.</p>
            )}
          </div>
        </article>

        <ArticleReviewActions articleId={article.id} version={revision.version} canApprove={canApprove} />
      </div>
    </CmsShell>
  );
}
