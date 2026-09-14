"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { useToast } from "./Toast";

/// 1h — the backend returns the same generic confirmation whether or not
/// the address belongs to an account; this form has nothing else to
/// branch on, by design.
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { info } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await clientFetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const body = (await res.json()) as { message: string };
      setMessage(body.message);
      info("Reset link requested", "Check your inbox — the link works once and expires.");
    } finally {
      setSubmitting(false);
    }
  }

  if (message) {
    return (
      <div className="space-y-space-4">
        <Alert variant="attention" title="Check your inbox — the link works once and expires.">
          {message} If nothing arrives, check your spam folder or ask the newsroom admin.
        </Alert>
        <p className="text-center">
          <Link href="/staff/sign-in" className="link-underline text-body-sm text-ink-muted hover:text-ink">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-space-3">
      {error ? <Alert variant="danger" title={error} /> : null}
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="username"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
        Send reset link
      </Button>
      <p className="text-center">
        <Link href="/staff/sign-in" className="link-underline text-body-sm text-ink-muted hover:text-ink">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
