"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { Alert } from "./Alert";

/// docs/12 PG-EDT-03. P2-11-style: the backend returns the same generic
/// confirmation whether or not the address belongs to an account — this
/// form has nothing else to branch on, by design.
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    } finally {
      setSubmitting(false);
    }
  }

  if (message) {
    return <Alert variant="success" title={message} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-space-4">
      {error ? <Alert variant="danger" title={error} /> : null}
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
        Send reset link
      </Button>
      <p className="text-center">
        <Link href="/staff/sign-in" className="text-body-sm text-accent underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
