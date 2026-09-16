import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { SourcesManager } from "@/components/cms/SourcesManager";
import { Reveal } from "@/components/motion/Reveal";
import { requireSession } from "@/lib/api/session";
import { listSourcesForStaff, listUsers } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Sources", robots: { index: false } };

/// 2p — editors add (source:create), admins verify, edit and retire
/// (source:manage). Both roles can open the page; the backend decides
/// what each may actually do.
export default async function SourcesPage() {
  const user = await requireSession();
  const [sources, users] = await Promise.all([
    listSourcesForStaff(),
    user.role === "ADMIN" ? listUsers().catch(() => []) : Promise.resolve([]),
  ]);
  const verifierNames = Object.fromEntries(users.map((u) => [u.id, u.displayName]));

  return (
    <CmsShell user={user}>
      <Reveal>
        <SourcesManager sources={sources} viewerRole={user.role} verifierNames={verifierNames} />
      </Reveal>
    </CmsShell>
  );
}
