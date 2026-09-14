import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CmsShell } from "@/components/cms/CmsShell";
import { ArticlesList } from "@/components/cms/ArticlesList";
import { PageHeader } from "@/components/cms/Panel";
import { Reveal } from "@/components/motion/Reveal";
import { requireSession } from "@/lib/api/session";
import { listMyArticles, listUsers } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Articles", robots: { index: false } };

/// 2i — the admin's "All articles" (listArticles already omits the
/// ownership filter for an ADMIN caller) and the editor's "My articles",
/// one component. The admin also gets the search/filter row, which needs
/// the staff directory for real owner names.
export default async function ArticlesPage() {
  const user = await requireSession();
  const isAdmin = user.role === "ADMIN";
  const [articles, users] = await Promise.all([listMyArticles(), isAdmin ? listUsers() : Promise.resolve(undefined)]);
  const waiting = articles.filter((a) => a.latestRevision?.state === "IN_REVIEW").length;
  const withDesk = articles.filter((a) => a.latestRevision?.state === "CHANGES_REQUESTED").length;

  return (
    <CmsShell user={user} width="wide">
      <Reveal>
        <PageHeader
          title={isAdmin ? "All articles" : "My articles"}
          lede={
            isAdmin
              ? `${articles.length} ${articles.length === 1 ? "story" : "stories"} · ${waiting} waiting on the desk`
              : `${articles.length} ${articles.length === 1 ? "story" : "stories"}${withDesk > 0 ? ` · ${withDesk} back with you` : ""}`
          }
          actions={
            isAdmin ? null : (
              <Link
                href="/staff/articles/new"
                className="inline-flex h-10 items-center gap-x-space-1 bg-accent px-space-4 text-body font-medium text-paper no-underline transition-colors hover:bg-accent-hover"
              >
                <Plus size={15} aria-hidden="true" />
                Start a story
              </Link>
            )
          }
        />
      </Reveal>
      <Reveal delay={0.05} className="mt-space-5">
        <ArticlesList articles={articles} users={users} viewerIsAdmin={isAdmin} />
      </Reveal>
    </CmsShell>
  );
}
