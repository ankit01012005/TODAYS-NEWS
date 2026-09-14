import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { AuditLog } from "@/components/cms/AuditLog";
import { Reveal } from "@/components/motion/Reveal";
import { requireRole } from "@/lib/api/session";
import { listAudit, listMyArticles, listUsers } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Audit log", robots: { index: false } };

const PAGE_SIZE = 50;

/// 2s — the record of record. Admin only (audit:view). Paged through
/// GET /audit's limit/offset; actor names and story headlines are joined
/// from the staff and article lists so a row reads as a sentence.
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireRole("ADMIN");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, users, articles] = await Promise.all([
    listAudit(PAGE_SIZE, (page - 1) * PAGE_SIZE),
    listUsers(),
    listMyArticles(),
  ]);

  return (
    <CmsShell user={user} width="wide">
      <Reveal>
        <AuditLog rows={rows} users={users} articles={articles} page={page} pageSize={PAGE_SIZE} />
      </Reveal>
    </CmsShell>
  );
}
