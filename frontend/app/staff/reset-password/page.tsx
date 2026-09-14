import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/cms/AuthCard";
import { SetPasswordFormLoader } from "@/components/cms/SetPasswordFormLoader";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

/// Where the forgot-password email lands. Same form and token mechanism
/// as accepting an invitation; only the wording and the endpoint differ.
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Newsroom" headline="Reset your password">
      <Suspense>
        <SetPasswordFormLoader mode="reset" />
      </Suspense>
    </AuthCard>
  );
}
