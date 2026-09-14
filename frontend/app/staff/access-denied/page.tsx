import type { Metadata } from "next";
import Link from "next/link";
import { CmsShell } from "@/components/cms/CmsShell";
import { requireSession } from "@/lib/api/session";

export const metadata: Metadata = { title: "Access denied", robots: { index: false } };

/// 1h "ACCESS DENIED" — a signed-in person reached something not theirs.
/// Capability, not role: editors never see review:* routes. Never
/// confirms that a particular story exists — this page is reached via
/// role-based UI routing only, never as a substitute for the backend's
/// own ownership check, which returns a plain 404 for that case.
export default async function AccessDeniedPage() {
  const user = await requireSession();
  return (
    <CmsShell user={user}>
      <div className="max-w-(--width-measure) border-l-[3px] border-brand pl-space-4">
        <p className="text-label text-brand">Access denied</p>
        <h1 className="mt-space-2 text-heading-1 text-ink">That page isn’t part of your desk.</h1>
        <p className="mt-space-2 text-body text-ink-secondary">
          Your account doesn’t have the capability this page needs. If you think it should, ask the newsroom admin.
        </p>
        <Link
          href="/staff"
          className="mt-space-5 inline-flex h-10 items-center border border-ink bg-paper px-space-4 text-body-sm text-ink no-underline transition-colors hover:bg-ink hover:text-paper"
        >
          Back to your dashboard
        </Link>
      </div>
    </CmsShell>
  );
}
