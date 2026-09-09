import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/cms/AuthCard";
import { SetPasswordFormLoader } from "@/components/cms/SetPasswordFormLoader";

export const metadata: Metadata = { title: "Set your password — Today News", robots: { index: false } };

export default function AcceptInvitationPage() {
  return (
    <AuthCard title="Set your password">
      <Suspense>
        <SetPasswordFormLoader />
      </Suspense>
    </AuthCard>
  );
}
