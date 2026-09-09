import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/cms/AuthCard";
import { SignInForm } from "@/components/cms/SignInForm";

export const metadata: Metadata = { title: "Sign in — Today News", robots: { index: false } };

/// PG-EDT-01 — the only door into the back-office.
export default function SignInPage() {
  return (
    <AuthCard title="Sign in to the newsroom">
      {/* useSearchParams (for a post-sign-in redirect target) requires a
          Suspense boundary in the App Router. */}
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthCard>
  );
}
