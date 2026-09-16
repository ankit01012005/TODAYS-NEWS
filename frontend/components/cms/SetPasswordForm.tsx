"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { useToast } from "./Toast";

/// Serves both first-time invitation acceptance and a forgot-password
/// reset — the backend uses one mechanism for both; `mode` only picks
/// which endpoint spends the token and how success is worded.
export type SetPasswordMode = "invitation" | "reset";

const ENDPOINTS: Record<SetPasswordMode, string> = {
  invitation: "/auth/accept-invitation",
  reset: "/auth/reset-password",
};

const DONE: Record<SetPasswordMode, { toast: string; detail: string; reason: string; button: string }> = {
  invitation: {
    toast: "Password set — welcome to the desk",
    detail: "Sign in with your email and the password you just chose.",
    reason: "password-set",
    button: "Set password & start",
  },
  reset: {
    toast: "Password changed",
    detail: "Sign in with your new password.",
    reason: "password-reset",
    button: "Change password",
  },
};

/// 1h's strength meter — three bars. Length carries most of the weight
/// (the API requires 12 characters); variety adds the rest. A hint under
/// the field says what would make it stronger, never just a colour.
export function scorePassword(password: string): { score: 0 | 1 | 2 | 3; label: string; hint: string } {
  if (password.length === 0) return { score: 0, label: "", hint: "At least 12 characters." };
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/].filter((re) => re.test(password)).length;
  if (password.length < 12) return { score: 1, label: "too short", hint: `${12 - password.length} more character${12 - password.length === 1 ? "" : "s"} needed.` };
  if (password.length >= 16 && classes >= 3) return { score: 3, label: "strong", hint: "Good — long and varied." };
  if (password.length >= 14 || classes >= 3) return { score: 2, label: "good", hint: "Longer, or a mix of cases, numbers and symbols, makes it stronger." };
  return { score: 1, label: "weak", hint: "Add length, or mix cases, numbers and symbols." };
}

export function StrengthMeter({ password }: { password: string }) {
  const { score, label, hint } = useMemo(() => scorePassword(password), [password]);
  const color = score === 3 ? "bg-success" : score === 2 ? "bg-gold" : "bg-brand";
  const text = score === 3 ? "text-success" : score === 2 ? "text-gold-deep" : "text-brand";
  return (
    <div aria-live="polite">
      <div className="flex items-center gap-x-space-2">
        {[1, 2, 3].map((step) => (
          <span key={step} className="h-[5px] flex-1 overflow-hidden bg-rule">
            <motion.span
              className={`block h-full ${color}`}
              initial={false}
              animate={{ scaleX: score >= step ? 1 : 0 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
            />
          </span>
        ))}
        <span className={`w-16 text-right text-caption ${label ? text : "text-ink-faint"}`}>{label || "—"}</span>
      </div>
      <p className="mt-space-1 text-caption text-ink-muted">{hint}</p>
    </div>
  );
}

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
      setError("The two passwords don’t match");
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
    <form onSubmit={handleSubmit} className="space-y-space-3">
      {error ? <Alert variant="danger" title={error} /> : null}
      <TextField
        id="password"
        label={mode === "reset" ? "New password" : "Choose a password"}
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <StrengthMeter password={password} />
      <TextField
        id="confirmPassword"
        label="Repeat it"
        type="password"
        autoComplete="new-password"
        required
        error={confirmPassword && confirmPassword !== password ? "Doesn’t match yet" : undefined}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
        {DONE[mode].button}
      </Button>
      <p className="text-center text-mono-sm text-ink-faint">Single-use link · setting a password signs out every other session</p>
    </form>
  );
}
