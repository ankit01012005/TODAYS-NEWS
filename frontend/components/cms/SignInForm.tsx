"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { useToast } from "./Toast";
import { AuthenticatedUser } from "@/lib/api/auth-types";

/// The post-login destination comes from the URL, so it must be a path
/// INSIDE the CMS and nothing else: no scheme, no host, no protocol-
/// relative "//", no backslash tricks. Anything else lands on the desk.
export function safeStaffPath(from: string | null): string {
  if (!from || !from.startsWith("/staff")) return "/staff";
  if (from.startsWith("//") || /[\\\s]/.test(from)) return "/staff";
  if (from !== "/staff" && !from.startsWith("/staff/") && !from.startsWith("/staff?")) return "/staff";
  return from;
}

/// Why someone landed here from another auth page — a note above the
/// form so the outcome of what they just did is confirmed even if the
/// toast has already gone.
const ARRIVAL_NOTES: Record<string, { title: string; body: string; variant: "success" | "attention" }> = {
  "password-set": {
    title: "Your password is set",
    body: "Your account is ready — sign in with your email and the password you just chose.",
    variant: "success",
  },
  "password-reset": {
    title: "Your password has been changed",
    body: "Sign in with your new password. Any other sessions you had open have been signed out.",
    variant: "success",
  },
  "signed-out": { title: "You’re signed out", body: "Sign in again whenever you’re ready.", variant: "success" },
  expired: { title: "Your session expired", body: "Sign in again to pick up where you left off.", variant: "attention" },
};

/// 1h — one generic message for every failure cause (wrong password,
/// unknown account, deactivated account); the backend already enforces
/// this and this form displays whatever comes back without adding a case
/// of its own that could differ.
export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success } = useToast();
  const arrival = ARRIVAL_NOTES[searchParams.get("reason") ?? ""] ?? null;
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
      const { user } = (await res.json()) as { user: AuthenticatedUser };
      const first = user.displayName.split(" ")[0] ?? user.displayName;
      success(`Welcome back, ${first}.`, user.role === "ADMIN" ? "The desk is yours." : "Let’s see what’s waiting on you.");
      router.push(safeStaffPath(searchParams.get("from")));
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-space-3">
      {arrival && !error ? (
        <Alert variant={arrival.variant} title={arrival.title}>
          {arrival.body}
        </Alert>
      ) : null}
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
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" variant="primary" size="lg" loading={submitting} loadingLabel="Signing in…" className="w-full">
        Sign in
      </Button>
      <p className="text-center">
        <Link href="/staff/forgot-password" className="link-underline text-body-sm text-ink-muted hover:text-ink">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
