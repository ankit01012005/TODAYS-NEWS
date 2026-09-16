"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { clientFetch } from "@/lib/api/client-fetch";
import { Wordmark } from "@/components/brand/Wordmark";
import { Avatar } from "@/components/public/Avatar";
import { Pill } from "./StatusBadge";
import { useToast } from "./Toast";

/// 1i — the CMS chrome is Indigo Black: the wordmark in Bone, "Newsroom",
/// the role pill and the person's avatar disc on the right. This header
/// is CMS-only and never appears on a public page.
export function CmsHeader({ user }: { user: AuthenticatedUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const { info } = useToast();

  async function handleSignOut() {
    setSigningOut(true);
    await clientFetch("/auth/sign-out", { method: "POST" });
    info("Signed out", "See you at the next bulletin.");
    router.push("/staff/sign-in?reason=signed-out");
    router.refresh();
  }

  return (
    <header className="band-dark sticky top-0 z-(--z-nav) border-b border-bone/10">
      <div className="mx-auto flex h-14 max-w-(--width-page-max-cms) items-center justify-between px-space-4 md:px-space-6">
        <div className="flex items-center gap-x-space-3">
          <Wordmark size="xs" tone="bone" pulse={false} href="/staff" label="Newsroom dashboard" />
          <span className="hidden text-body-sm text-bone/60 sm:inline">Newsroom</span>
        </div>
        <div className="flex items-center gap-x-space-3">
          <Pill tone="bone">{user.role === "ADMIN" ? "Admin" : "Editor"}</Pill>
          <Link
            href="/staff/profile"
            className="group flex items-center gap-x-space-2 no-underline"
            aria-label={`${user.displayName} — your profile`}
          >
            <Avatar name={user.displayName} size={28} tone="bone" />
            <span className="link-underline hidden text-body-sm text-bone/85 group-hover:text-bone md:inline">{user.displayName}</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            className="inline-flex h-8 items-center gap-x-space-1 border border-bone/30 px-space-2 text-body-sm text-bone/80 transition-colors duration-(--duration-fast) hover:border-bone hover:text-bone disabled:opacity-60"
          >
            <LogOut size={13} aria-hidden="true" />
            <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
