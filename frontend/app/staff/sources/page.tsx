import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { SourcesManager } from "@/components/cms/SourcesManager";
import { requireRole } from "@/lib/api/session";
import { listSourcesForStaff } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Sources — Today News", robots: { index: false } };

export default async function SourcesPage() {
  const user = await requireRole("ADMIN");
  const sources = await listSourcesForStaff();

  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">Sources</h1>
      <div className="mt-space-5">
        <SourcesManager sources={sources} />
      </div>
    </CmsShell>
  );
}
