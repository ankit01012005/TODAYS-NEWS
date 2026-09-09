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
    <header className="flex items-center justify-between border-b border-rule px-space-5 py-space-3">
      <div className="flex items-center gap-x-space-3">
        <Link href="/staff" className="text-heading-4 text-ink no-underline">
          Today News
        </Link>
        <span className="text-label text-ink-muted">{user.role === "ADMIN" ? "Newsroom" : "Editor"}</span>
      </div>
      <div className="flex items-center gap-x-space-4">
        <Link href="/staff/profile" className="text-body-sm text-ink-secondary no-underline hover:underline">
          {user.displayName}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="text-body-sm text-accent underline disabled:text-ink-faint"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
