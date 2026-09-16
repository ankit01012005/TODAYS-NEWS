import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft, History, ShieldCheck } from "lucide-react";
import { CmsShell } from "@/components/cms/CmsShell";
import { ArticleReviewActions } from "@/components/cms/ArticleReviewActions";
import { Alert } from "@/components/cms/Alert";
import { Panel } from "@/components/cms/Panel";
import { Pill, StatusBadge } from "@/components/cms/StatusBadge";
import { ArticleBody } from "@/components/public/ArticleBody";
import { Reveal } from "@/components/motion/Reveal";
import { requireRole } from "@/lib/api/session";
import { getArticle, getArticleSources, getRevisionHistory, listCategoriesForStaff, listMedia, listUsers } from "@/lib/api/cms";
import { RevisionView } from "@/lib/api/cms-types";
import { formatDateTime, formatRelative, formatWaiting } from "@/lib/format-date";

export const metadata: Metadata = { title: "Decision", robots: { index: false } };

/// 1l — "Proposed" (red border) beside "Currently live" (muted), with a
/// warning when the proposed section differs because publishing changes
/// the URL; the full story as a reader would see it (ArticleBody — the
/// same renderer the public site uses, true by construction); earlier
/// rounds; and the decision panel carrying the loaded version.
export default async function ArticleReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("ADMIN");
  const article = await getArticle(id);
  // Nothing to decide if it isn't awaiting a decision — a stale link
  // (already decided by another admin, or never existed) gets the same
  // clean 404 either way.
  if (!article || !article.openRevision || article.openRevision.state !== "IN_REVIEW") {
    notFound();
  }
  const revision = article.openRevision;

  const [categories, attachedSources, media, history, users] = await Promise.all([
    listCategoriesForStaff(),
    getArticleSources(id),
    listMedia(),
    getRevisionHistory(id),
    listUsers(),
  ]);

  const nameOf = (userId: string | null) => (userId ? (users.find((u) => u.id === userId)?.displayName ?? "—") : "—");
  const category = categories.find((c) => c.id === revision.categoryId) ?? { name: "Uncategorised", slug: "" };
  const liveCategory = categories.find((c) => c.id === article.categoryId) ?? null;
  const isLive = article.publicationStatus === "LIVE";
  const sectionChanges = isLive && revision.categoryId !== article.categoryId;
  const featuredAsset = revision.featuredImageId ? (media.find((m) => m.id === revision.featuredImageId) ?? null) : null;
  const live: RevisionView | null = article.publishedRevision;
  const liveByline = article.bylineOverride ?? nameOf(article.ownerId);
  const proposedByline = revision.bylineOverride ?? nameOf(article.ownerId);
  const canApprove = article.ownerId !== user.id && revision.createdByUserId !== user.id;
  const since = revision.submittedAt ?? revision.createdAt;

  const earlierRounds = history
    .flatMap((r) => r.reviewDecisions.map((d) => ({ decision: d, revision: r })))
    .sort((a, b) => b.decision.decidedAt.localeCompare(a.decision.decidedAt));

  return (
    <CmsShell user={user} width="full">
      <div className="-mt-space-5 md:-mt-space-6">
        <div className="band-dark sticky top-14 z-30 -mx-space-4 flex min-h-12 flex-wrap items-center justify-between gap-x-space-4 gap-y-space-2 px-space-4 py-space-2 md:-mx-space-6 md:px-space-6">
          <Link href="/staff/review" className="inline-flex items-center gap-x-space-1 text-body-sm text-bone/65 no-underline hover:text-bone">
            <ChevronLeft size={14} aria-hidden="true" />
            Review queue
          </Link>
          <div className="flex items-center gap-x-space-3">
            <StatusBadge state="IN_REVIEW" onDark />
            <span className="text-mono-sm text-bone/60">waiting {formatWaiting(since)}</span>
            <span className="text-mono-sm text-bone/60">v{revision.version}</span>
            <Link href={`/staff/articles/${article.id}/history`} className="inline-flex items-center gap-x-space-1 text-body-sm text-bone/65 no-underline hover:text-bone">
              <History size={13} aria-hidden="true" />
              History
            </Link>
          </div>
        </div>

        <div className="mt-space-5 grid grid-cols-1 gap-x-space-6 gap-y-space-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-space-5">
            <Reveal>
              <div className="grid grid-cols-1 gap-space-4 md:grid-cols-2">
                <Panel tone="paper" className="!border-brand">
                  <p className="text-label text-brand">Proposed — what publishing would put live</p>
                  <h1 className="mt-space-2 text-heading-2 text-ink">{revision.headline || "Untitled"}</h1>
                  <p className="mt-space-2 text-body-sm text-ink-secondary">{revision.summary}</p>
                  {featuredAsset ? (
                    <div className="relative mt-space-3 aspect-16/9 overflow-hidden bg-surface-deep">
                      <Image src={featuredAsset.url} alt={revision.featuredImageAlt ?? ""} fill sizes="480px" className="object-cover" />
                    </div>
                  ) : null}
                  <div className="mt-space-3 flex flex-wrap gap-space-1">
                    <Pill tone="brand">{category.name}</Pill>
                    <Pill tone="muted">byline: {proposedByline}</Pill>
                    <Pill tone="muted">
                      {attachedSources.length} source{attachedSources.length === 1 ? "" : "s"}
                    </Pill>
                  </div>
                  <p className="mt-space-3 text-mono-sm text-ink-muted">
                    submitted {revision.submittedAt ? formatDateTime(revision.submittedAt) : "—"} by {nameOf(revision.createdByUserId)}
                  </p>
                </Panel>

                <Panel tone="sunken">
                  <p className="text-label text-ink-muted">{isLive ? "Currently live" : "Not yet published"}</p>
                  {isLive && live ? (
                    <>
                      <p className="mt-space-2 text-heading-2 text-ink-secondary">{live.headline || "Untitled"}</p>
                      <p className="mt-space-2 text-body-sm text-ink-muted">{live.summary}</p>
                      <div className="mt-space-3 flex flex-wrap gap-space-1">
                        <Pill tone="muted">{liveCategory?.name ?? "—"}</Pill>
                        <Pill tone="muted">byline: {liveByline}</Pill>
                      </div>
                      <p className="mt-space-3 text-mono-sm text-ink-muted">
                        published {article.publishedAt ? formatRelative(article.publishedAt) : "—"} · v{live.version}
                      </p>
                    </>
                  ) : (
                    <p className="mt-space-2 text-body-sm text-ink-muted">
                      This would be the story’s first publication. Its address becomes{" "}
                      <span className="text-mono text-ink">/{category.slug}/{article.slug}</span> — fixed forever from then on.
                    </p>
                  )}
                </Panel>
              </div>
              {sectionChanges ? (
                <Alert variant="attention" title="Section changed — publishing moves the story’s URL" className="mt-space-3">
                  From /{liveCategory?.slug ?? "…"}/{article.slug} to /{category.slug}/{article.slug}. Links to the old address will
                  stop working.
                </Alert>
              ) : null}
            </Reveal>

            <Reveal delay={0.05}>
              <article className="border border-rule-strong bg-paper p-space-5 md:p-space-6">
                <p className="text-label text-ink-muted">As a reader would see it</p>
                <h2 className="article-title mt-space-3 text-ink">{revision.headline || "Untitled"}</h2>
                <p className="mt-space-3 text-standfirst text-ink-secondary">{revision.summary}</p>
                {featuredAsset ? (
                  <figure className="mt-space-5">
                    <div className="relative aspect-3/2 overflow-hidden bg-surface-deep">
                      <Image src={featuredAsset.url} alt={revision.featuredImageAlt ?? ""} fill sizes="(min-width: 900px) 760px, 100vw" className="object-cover" />
                    </div>
                    {revision.featuredImageCaption || revision.featuredImageCredit ? (
                      <figcaption className="mt-space-2 text-caption text-ink-muted">
                        {revision.featuredImageCaption}
                        {revision.featuredImageCaption && revision.featuredImageCredit ? " · " : ""}
                        {revision.featuredImageCredit}
                      </figcaption>
                    ) : null}
                    {!revision.featuredImageAlt ? (
                      <p className="mt-space-2 text-caption text-danger">This picture has no alt text.</p>
                    ) : null}
                  </figure>
                ) : null}
                <div className="mx-auto mt-space-6 max-w-(--width-measure)">
                  <ArticleBody body={revision.body} />
                </div>
                <div className="mt-space-6 border-t border-rule pt-space-4">
                  <h3 className="text-label text-ink-muted">Sources</h3>
                  {attachedSources.length > 0 ? (
                    <ul className="mt-space-2 space-y-space-2">
                      {attachedSources.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center gap-x-space-2 text-body-sm text-ink-secondary">
                          {s.source.verified ? (
                            <Pill tone="success">
                              <ShieldCheck size={11} aria-hidden="true" /> verified
                            </Pill>
                          ) : (
                            <Pill tone="muted">unverified</Pill>
                          )}
                          <span className="text-ink">{s.source.name}</span>
                          {s.note ? <span>— {s.note}</span> : null}
                          <span className="text-mono-sm text-ink-faint">{s.isPublic ? "public" : "hidden from readers"}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-space-2 text-body-sm text-ink-muted">No sources attached.</p>
                  )}
                </div>
              </article>
            </Reveal>

            {earlierRounds.length > 0 ? (
              <Reveal delay={0.08}>
                <Panel heading="Earlier rounds">
                  <ol className="border-l-2 border-ink/15 pl-space-3">
                    {earlierRounds.map(({ decision, revision: rev }) => (
                      <li key={decision.id} className="py-space-2 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-x-space-2">
                          <Pill tone={decision.decision === "APPROVED" ? "success" : decision.decision === "REJECTED" ? "brand" : "gold"}>
                            {decision.decision === "APPROVED" ? "approved" : decision.decision === "REJECTED" ? "rejected" : "changes requested"}
                          </Pill>
                          <span className="text-mono-sm text-ink-muted">v{rev.version}</span>
                        </div>
                        {decision.comment ? <p className="mt-space-1 text-body-sm text-ink">“{decision.comment}”</p> : null}
                        <p className="mt-space-1 text-caption text-ink-muted">
                          {formatDateTime(decision.decidedAt)} · {nameOf(decision.decidedByUserId)}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </Reveal>
            ) : null}
          </div>

          <div>
            <ArticleReviewActions articleId={article.id} version={revision.version} canApprove={canApprove} sectionChanges={sectionChanges} />
          </div>
        </div>
      </div>
    </CmsShell>
  );
}
