import { ReactNode } from "react";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { CmsHeader } from "./CmsHeader";
import { CmsSideNav } from "./CmsSideNav";

/// The shared shell for every authenticated /staff page. Not used by
/// sign-in/forgot-password/accept-invitation — there's no session yet, so
/// no header/nav to show. Brief §24: same identity as the paper, a more
/// restrained interface. The side nav is a sticky column at md+ and a
/// horizontal strip beneath the header at xs (docs/19 §2.4's "sheet at
/// xs", realised as a rail so nothing is hidden behind a toggle).
export function CmsShell({ user, children }: { user: AuthenticatedUser; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <CmsHeader user={user} />
      <div className="mx-auto flex max-w-(--width-page-max-cms) flex-col md:flex-row">
        <CmsSideNav user={user} />
        <main id="content" className="min-w-0 flex-1 px-space-4 py-space-5 md:px-space-6 md:py-space-6">{children}</main>
      </div>
    </div>
  );
}
