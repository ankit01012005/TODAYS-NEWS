import { ReactNode } from "react";

/// Shared minimal centred-card layout for sign-in/forgot-password/
/// accept-invitation. Deliberately reveals nothing about who works here —
/// docs/12 PG-EDT-01: "no hint about who works here, no list of users."
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-space-4">
      <div className="w-full max-w-sm rounded-md border border-rule bg-paper p-space-6">
        <h1 className="text-heading-3 text-ink">Today News</h1>
        <p className="mt-space-1 text-body-sm text-ink-muted">{title}</p>
        <div className="mt-space-5">{children}</div>
      </div>
    </div>
  );
}
