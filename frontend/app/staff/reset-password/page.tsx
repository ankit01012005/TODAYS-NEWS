import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/cms/AuthCard";
import { SetPasswordFormLoader } from "@/components/cms/SetPasswordFormLoader";

export const metadata: Metadata = { title: "Choose a new password — Today News", robots: { index: false } };

/// Where the forgot-password email lands (docs/12 PG-EDT-04). Same form
/// and token mechanism as accepting an invitation; only the wording and
/// the endpoint it spends the token against differ.
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password">
      <Suspense>
        <SetPasswordFormLoader mode="reset" />
      </Suspense>
    </AuthCard>
  );
}
