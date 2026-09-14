import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { NewArticleForm } from "@/components/cms/NewArticleForm";
import { PageHeader } from "@/components/cms/Panel";
import { Reveal } from "@/components/motion/Reveal";
import { requireRole } from "@/lib/api/session";
import { listCategoriesForStaff } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Start a story", robots: { index: false } };

/// 2j — "the one irreversible field". Admin cannot author; this page is
/// editor-only, same UI-routing-convenience pattern as the admin-only
/// pages (session.ts's requireRole).
export default async function NewArticlePage() {
  const user = await requireRole("EDITOR");
  const categories = await listCategoriesForStaff();

  return (
    <CmsShell user={user}>
      <Reveal>
        <PageHeader title="Start a story" lede="Just enough to open a draft. Everything else you can change as you write." />
      </Reveal>
      <Reveal delay={0.05} className="mt-space-5">
        <NewArticleForm categories={categories} defaultByline={user.displayName} />
      </Reveal>
    </CmsShell>
  );
}
