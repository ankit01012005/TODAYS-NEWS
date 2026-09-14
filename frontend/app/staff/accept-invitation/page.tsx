import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/cms/AuthCard";
import { SetPasswordFormLoader } from "@/components/cms/SetPasswordFormLoader";

export const metadata: Metadata = { title: "You’ve been invited", robots: { index: false } };

/// 1h — accept-invitation: choose a password, watch the meter, start.
export default function AcceptInvitationPage() {
  return (
    <AuthCard title="Newsroom" eyebrow="You’ve been invited" headline="Welcome to the desk.">
      <p className="mb-space-4 text-body-sm text-ink-secondary">
        Choose the password you’ll sign in with. The link you followed works once.
      </p>
      <Suspense>
        <SetPasswordFormLoader />
      </Suspense>
    </AuthCard>
  );
}
