"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { useToast } from "./Toast";

/// docs/12 PG-EDT-04. Serves both first-time invitation acceptance and a
/// forgot-password reset — the backend uses one mechanism for both
/// (docs/23 §11.3: "same mechanism"), so this form does too; `mode` only
/// picks which endpoint spends the token and how success is worded.
export type SetPasswordMode = "invitation" | "reset";

const ENDPOINTS: Record<SetPasswordMode, string> = {
  invitation: "/auth/accept-invitation",
  reset: "/auth/reset-password",
};

/// Confirmed twice on success — a toast the moment it happens, and a note
/// on the sign-in page it lands on (SignInForm's ARRIVAL_NOTES), so the
/// outcome is unmistakable even if the toast has faded.
const DONE: Record<SetPasswordMode, { toast: string; detail: string; reason: string }> = {
  invitation: {
    toast: "Password set — your account is ready",
    detail: "Sign in with your email and the password you just chose.",
    reason: "password-set",
  },
  reset: {
    toast: "Password changed",
    detail: "Sign in with your new password.",
    reason: "password-reset",
  },
};

export function SetPasswordForm({ token, mode = "invitation" }: { token: string | null; mode?: SetPasswordMode }) {
  const router = useRouter();
  const { success } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <Alert variant="danger" title="This link is invalid or has expired">
        {mode === "reset"
          ? "Request a new one from the sign-in page."
          : "Ask the newsroom admin to re-send your invitation."}
      </Alert>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await clientFetch(ENDPOINTS[mode], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      success(DONE[mode].toast, DONE[mode].detail);
      router.push(`/staff/sign-in?reason=${DONE[mode].reason}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-space-4">
      {error ? <Alert variant="danger" title={error} /> : null}
      <TextField
        id="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        hint="At least 12 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
        Set password
      </Button>
    </form>
  );
}
