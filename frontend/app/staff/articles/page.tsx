import type { Metadata } from "next";
import Link from "next/link";
import { CmsShell } from "@/components/cms/CmsShell";
import { Button } from "@/components/cms/Button";
import { MyArticlesList } from "@/components/cms/MyArticlesList";
import { requireSession } from "@/lib/api/session";
import { listMyArticles } from "@/lib/api/cms";

export const metadata: Metadata = { title: "My Articles — Today News", robots: { index: false } };

/// docs/12 PG-EDT-06 (editor) / PG-ADM-04 (admin, same shape — listArticles
/// already omits the ownership filter for an ADMIN caller).
export default async function ArticlesPage() {
  const user = await requireSession();
  const articles = await listMyArticles();

  return (
    <CmsShell user={user}>
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 text-ink">{user.role === "ADMIN" ? "All Articles" : "My Articles"}</h1>
        <Link href="/staff/articles/new">
          <Button variant="primary">Write a new article</Button>
        </Link>
      </div>
      <div className="mt-space-5">
        <MyArticlesList articles={articles} />
      </div>
    </CmsShell>
  );
}
