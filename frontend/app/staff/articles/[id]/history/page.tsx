import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CmsShell } from "@/components/cms/CmsShell";
import { PageHeader } from "@/components/cms/Panel";
import { RevisionTimeline } from "@/components/cms/RevisionTimeline";
import { Reveal } from "@/components/motion/Reveal";
import { requireSession } from "@/lib/api/session";
import { getArticle, getArticleAudit, getRevisionHistory, listUsers } from "@/lib/api/cms";
import { formatPublicDateShort } from "@/lib/format-date";

export const metadata: Metadata = { title: "History", robots: { index: false } };

/// 2l — every revision, every decision. Owner or admin (the API enforces
/// it: a stranger gets a 404 from every call below). Strictly read-only
/// for everyone, including admins — no edit/delete control exists
/// anywhere on this page.
export default async function ArticleHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSession();
  const article = await getArticle(id);
  if (!article) notFound();

  const [audit, history, users] = await Promise.all([
    getArticleAudit(id),
    getRevisionHistory(id),
    user.role === "ADMIN" ? listUsers().catch(() => []) : Promise.resolve([]),
  ]);
  const names: Record<string, string> = Object.fromEntries(users.map((u) => [u.id, u.displayName]));
  names[user.id] = user.displayName;
  for (const entry of audit) if (entry.actorUserId && entry.actorDisplayName) names[entry.actorUserId] = entry.actorDisplayName;

  const publishedCount = history.filter((r) => r.publishedAt !== null).length;
  const corrections = Math.max(0, publishedCount - 1);
  const first = article.firstPublishedAt ? formatPublicDateShort(article.firstPublishedAt) : null;
  const headline = article.openRevision?.headline ?? article.publishedRevision?.headline ?? article.slug;

  return (
    <CmsShell user={user}>
      <Reveal>
        <Link href={`/staff/articles/${article.id}/edit`} className="inline-flex items-center gap-x-space-1 text-body-sm text-ink-muted no-underline hover:text-ink">
          <ChevronLeft size={14} aria-hidden="true" />
          Back to the story
        </Link>
        <div className="mt-space-2">
          <PageHeader
            title="History"
            lede={
              <>
                <span className="text-ink">{headline}</span>
                {" · "}
                {history.length} revision{history.length === 1 ? "" : "s"}
                {first ? ` · first published ${first}` : " · never published"}
                {corrections > 0 ? ` · corrected ${corrections === 1 ? "once" : `${corrections} times`}` : ""}
              </>
            }
          />
        </div>
      </Reveal>
      <Reveal delay={0.05} className="mt-space-6">
        {history.length > 0 ? (
          <RevisionTimeline
            revisions={history}
            audit={audit}
            names={names}
            liveRevisionId={article.publicationStatus === "LIVE" ? (article.publishedRevision?.id ?? null) : null}
            articleId={article.id}
          />
        ) : (
          <p className="text-body-sm text-ink-muted">No history recorded yet.</p>
        )}
      </Reveal>
    </CmsShell>
  );
}
