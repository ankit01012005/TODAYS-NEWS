import { ReactNode } from "react";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { CmsHeader } from "./CmsHeader";
import { CmsSideNav } from "./CmsSideNav";

/// The shared shell for every authenticated /staff page: the dark header,
/// the side nav (a horizontal rail below 900px), and the content on the
/// soft ground (#FCFBF8). Not used by sign-in/forgot-password/accept-
/// invitation — there's no session yet, so no header/nav to show.
/// `reviewCount` puts the queue's size next to its nav item where a page
/// already has it to hand.
export function CmsShell({
  user,
  reviewCount,
  width = "default",
  children,
}: {
  user: AuthenticatedUser;
  reviewCount?: number;
  width?: "default" | "wide" | "full";
  children: ReactNode;
}) {
  const maxWidth = width === "wide" ? "max-w-[1180px]" : width === "full" ? "" : "max-w-[960px]";
  return (
    <div className="min-h-screen bg-surface-soft text-ink">
      <CmsHeader user={user} />
      <div className="mx-auto flex max-w-(--width-page-max-cms) flex-col md:flex-row">
        <CmsSideNav user={user} reviewCount={reviewCount} />
        <main id="content" className="min-w-0 flex-1 px-space-4 py-space-5 md:px-space-6 md:py-space-6">
          <div className={maxWidth}>{children}</div>
        </main>
      </div>
    </div>
  );
}
