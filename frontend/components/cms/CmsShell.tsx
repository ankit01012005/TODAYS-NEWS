import { ReactNode } from "react";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { CmsHeader } from "./CmsHeader";
import { CmsSideNav } from "./CmsSideNav";

/// The shared shell for every authenticated /staff page. Not used by
/// sign-in/forgot-password/accept-invitation — there's no session yet, so
/// no header/nav to show.
export function CmsShell({ user, children }: { user: AuthenticatedUser; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <CmsHeader user={user} />
      <div className="mx-auto flex max-w-(--width-page-max-cms)">
        <CmsSideNav user={user} />
        <main className="min-w-0 flex-1 px-space-5 py-space-5">{children}</main>
      </div>
    </div>
  );
}
