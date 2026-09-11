import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { SocialPicksManager } from "@/components/cms/SocialPicksManager";
import { requireRole } from "@/lib/api/session";
import { listSocialPicks } from "@/lib/api/cms";

export const metadata: Metadata = { title: "Social picks — Today News", robots: { index: false } };

/// Admin-only (social:manage; requireRole is the UI-routing convenience,
/// the API is the real gate). The newsroom's daily hand-picked posts for
/// the front page's "Top on social" rail.
export default async function SocialPicksPage() {
  const user = await requireRole("ADMIN");
  const picks = await listSocialPicks();

  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">Social picks</h1>
      <p className="mt-space-2 max-w-[60ch] text-body-sm text-ink-secondary">
        Posts worth pointing readers at today, found by hand. They appear on the front page as soon as they are
        added and stay until removed — refresh the list each morning.
      </p>
      <div className="mt-space-5">
        <SocialPicksManager picks={picks} />
      </div>
    </CmsShell>
  );
}
