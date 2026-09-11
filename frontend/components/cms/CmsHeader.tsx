"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { clientFetch } from "@/lib/api/client-fetch";

/// docs/19 §2.4 — wordmark + area label ("Editor"/"Newsroom"), user menu
/// right. SEO-09: this masthead is CMS-only and never appears on a public
/// page — no cross-linking either direction.
export function CmsHeader({ user }: { user: AuthenticatedUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await clientFetch("/auth/sign-out", { method: "POST" });
    router.push("/staff/sign-in");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-(--z-nav) border-b border-rule bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-(--width-page-max-cms) items-center justify-between px-space-4 md:px-space-6">
        <div className="flex items-center gap-x-space-3">
          <Link href="/staff" className="text-wordmark text-[22px] text-ink no-underline">
            Today News
            <span className="text-brand" aria-hidden="true">
              .
            </span>
          </Link>
          <span className="rounded-pill border border-rule bg-surface px-space-2 py-px text-label text-ink-muted">
            {user.role === "ADMIN" ? "Newsroom" : "Editor"}
          </span>
        </div>
        <div className="flex items-center gap-x-space-4">
          <Link
            href="/staff/profile"
            className="link-underline hidden text-body-sm text-ink-secondary hover:text-ink sm:inline"
          >
            {user.displayName}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex h-8 items-center rounded-sm border border-rule-strong bg-paper px-space-3 text-body-sm text-ink transition-colors duration-(--duration-fast) hover:bg-surface disabled:text-ink-faint"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
