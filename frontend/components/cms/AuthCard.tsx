import { ReactNode } from "react";

/// Shared minimal centred-card layout for sign-in/forgot-password/
/// accept-invitation. Deliberately reveals nothing about who works here —
/// docs/12 PG-EDT-01: "no hint about who works here, no list of users."
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface-band flex min-h-screen items-center justify-center px-space-4 py-space-8">
      <div className="w-full max-w-sm">
        <p className="text-wordmark text-center text-[40px] text-ink">
          Today News
          <span className="text-brand" aria-hidden="true">
            .
          </span>
        </p>
        <div className="mt-space-5 rounded-md border border-rule border-t-2 border-t-brand bg-paper p-space-6 shadow-depth-2">
          <h1 className="text-heading-3 text-ink">{title}</h1>
          <div className="mt-space-5">{children}</div>
        </div>
        <p className="mt-space-4 text-center text-caption text-ink-faint">Staff access only.</p>
      </div>
    </div>
  );
}
