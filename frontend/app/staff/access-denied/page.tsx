import type { Metadata } from "next";
import { CmsShell } from "@/components/cms/CmsShell";
import { requireSession } from "@/lib/api/session";
import Link from "next/link";

export const metadata: Metadata = { title: "Access denied — Today News", robots: { index: false } };

/// PG-EDT-11 — a signed-in user reached something not theirs. Never
/// confirms that a particular story exists (P2-10) — this page is reached
/// via role-based UI routing only (session.ts's requireRole), never as a
/// substitute for the backend's own ownership check, which returns a
/// plain 404 for that case instead (SEC-03).
export default async function AccessDeniedPage() {
  const user = await requireSession();
  return (
    <CmsShell user={user}>
      <h1 className="text-heading-2 text-ink">This isn&rsquo;t available to you</h1>
      <p className="mt-space-3 text-body text-ink-secondary">
        Your account doesn&rsquo;t have access to this page.
      </p>
      <Link href="/staff" className="mt-space-5 inline-block text-body text-accent underline">
        Back to your dashboard
      </Link>
    </CmsShell>
  );
}
