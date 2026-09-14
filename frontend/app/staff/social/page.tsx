import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { SocialPicksManager } from "@/components/cms/SocialPicksManager";
import { Reveal } from "@/components/motion/Reveal";
import { requireRole } from "@/lib/api/session";
import { listSocialPicks } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Social picks", robots: { index: false } };

/// 2q — admin-only (social:manage; requireRole is the UI-routing
/// convenience, the API is the real gate).
export default async function SocialPicksPage() {
  const user = await requireRole("ADMIN");
  const picks = await listSocialPicks();

  return (
    <CmsShell user={user}>
      <Reveal>
        <SocialPicksManager picks={picks} />
      </Reveal>
    </CmsShell>
  );
}
