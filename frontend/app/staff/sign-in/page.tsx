import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/cms/AuthCard";
import { SignInForm } from "@/components/cms/SignInForm";

export const metadata: Metadata = { title: "Newsroom sign-in", robots: { index: false } };

/// 1h — the only door into the back-office. No sign-up link: invite only.
export default function SignInPage() {
  return (
    <AuthCard title="Newsroom sign-in">
      {/* useSearchParams (for a post-sign-in redirect target) requires a
          Suspense boundary in the App Router. */}
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthCard>
  );
}
