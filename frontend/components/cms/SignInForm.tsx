"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { Alert } from "./Alert";

/// docs/27 A5 — the post-login destination comes from the URL, so it must
/// be a path INSIDE the CMS and nothing else: no scheme, no host, no
/// protocol-relative "//", no backslash tricks. Anything that doesn't
/// match lands on the dashboard.
export function safeStaffPath(from: string | null): string {
  if (!from || !from.startsWith("/staff")) return "/staff";
  if (from.startsWith("//") || /[\\\s]/.test(from)) return "/staff";
  if (from !== "/staff" && !from.startsWith("/staff/") && !from.startsWith("/staff?")) return "/staff";
  return from;
}

/// docs/12 PG-EDT-01. P2-11: one generic message for every failure cause
/// (wrong password, unknown account, deactivated account) — the backend
/// already enforces this (auth.service.ts's signIn); this form just
/// displays whatever message comes back without adding a case of its own
/// that could differ.
export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await clientFetch("/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.push(safeStaffPath(searchParams.get("from")));
      router.refresh();
    } finally {
      setSubmitting(false);
    }
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
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
        Sign in
      </Button>
      <p className="text-center">
        <Link href="/staff/forgot-password" className="text-body-sm text-accent underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
