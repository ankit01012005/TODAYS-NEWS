import type { Metadata } from "next";
import Link from "next/link";
import { CmsShell } from "@/components/cms/CmsShell";
import { Button } from "@/components/cms/Button";
import { Alert } from "@/components/cms/Alert";
import { ArticleListRow } from "@/components/cms/ArticleListRow";
import { AdminDashboard } from "@/components/cms/AdminDashboard";
import { requireSession } from "@/lib/api/session";
import { getReviewQueue, listMyArticles } from "@/lib/api/cms";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { ArticleListItemView } from "@/lib/api/cms-types";

export const metadata: Metadata = { title: "Dashboard — Today News", robots: { index: false } };

/// PG-ADM-01 — an admin's dashboard is a different job from an editor's
/// (docs/10 §0: "deciding" vs. "running the newsroom"), so it's a
/// different component entirely rather than a filtered view of the same
/// one.
export default async function DashboardPage() {
  const user = await requireSession();
  if (user.role === "ADMIN") {
    return <AdminDashboardPage user={user} />;
  }
  return <EditorDashboardPage user={user} />;
}

async function AdminDashboardPage({ user }: { user: AuthenticatedUser }) {
  // listMyArticles() calls GET /articles, which returns ALL articles for
  // an ADMIN caller (no ownership filter server-side) — same fetch
  // /staff/articles already reuses for "All Articles".
  const [queue, articles] = await Promise.all([getReviewQueue(), listMyArticles()]);
  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">Dashboard</h1>
      <div className="mt-space-6">
        <AdminDashboard queue={queue} articles={articles} />
      </div>
    </CmsShell>
  );
}

/// PG-EDT-05. docs/09 §0: an editor thinks about exactly two things —
/// "what am I working on?" and "what is waiting for me?" — every section
/// here answers one of those. docs/09 §E-03's proposed minimum: needs-
/// attention first (the most important thing on the page), then in-
/// progress, waiting, recently published, write-new.
async function EditorDashboardPage({ user }: { user: AuthenticatedUser }) {
  const articles = await listMyArticles();

  const needsAttention = articles.filter((a) => a.latestRevision?.state === "CHANGES_REQUESTED");
  const inProgress = articles.filter((a) => a.latestRevision?.state === "DRAFT");
  const waiting = articles.filter((a) => a.latestRevision?.state === "IN_REVIEW");
  const recentlyPublished = articles
    .filter((a) => a.publicationStatus === "LIVE")
    .slice(0, 5);

  const isEmpty = articles.length === 0;

  return (
    <CmsShell user={user}>
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 text-ink">Dashboard</h1>
        <Link href="/staff/articles/new">
          <Button variant="primary">Write a new article</Button>
        </Link>
      </div>

      {isEmpty ? (
        <div className="mt-space-8 text-center">
          <p className="text-heading-4 text-ink">Nothing here yet</p>
          <p className="mt-space-2 text-body text-ink-secondary">
            Write your first story to see it here.
          </p>
        </div>
      ) : (
        <div className="mt-space-6 space-y-space-6">
          {needsAttention.length > 0 ? (
            <DashboardSection title={`Changes requested (${needsAttention.length})`} articles={needsAttention} attention />
          ) : null}
          <DashboardSection title="In progress" articles={inProgress} emptyText="No drafts in progress." />
          <DashboardSection title="Waiting for review" articles={waiting} emptyText="Nothing waiting for review." />
          <DashboardSection
            title="Recently published"
            articles={recentlyPublished}
            emptyText="Nothing published yet."
          />
        </div>
      )}
    </CmsShell>
  );
}

function DashboardSection({
  title,
  articles,
  emptyText,
  attention,
}: {
  title: string;
  articles: ArticleListItemView[];
  emptyText?: string;
  attention?: boolean;
}) {
  return (
    <section>
      {attention ? (
        <Alert variant="attention" title={title} />
      ) : (
        <h2 className="text-heading-4 text-ink">{title}</h2>
      )}
      <div className="mt-space-3 rounded-md border border-rule">
        {articles.length > 0 ? (
          articles.map((article) => <ArticleListRow key={article.id} article={article} />)
        ) : (
          <p className="px-space-3 py-space-4 text-body-sm text-ink-muted">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
