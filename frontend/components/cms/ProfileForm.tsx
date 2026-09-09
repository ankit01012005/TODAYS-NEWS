"use client";

import { FormEvent, useState } from "react";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { TextField } from "./TextField";

/// docs/09 E-10 / docs/12 PG-EDT-10 — display name and password change,
/// current-password required to set a new one. Calls the new
/// PATCH /auth/me (auth.service.ts's updateProfile). No self-role-change
/// control exists here — the capability doesn't exist for an editor
/// regardless (USR-02), so there's nothing to hide.
export function ProfileForm({ user }: { user: AuthenticatedUser }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await clientFetch("/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      setMessage("Profile updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-space-4">
      {error ? <Alert variant="danger" title={error} /> : null}
      {message ? <Alert variant="success" title={message} /> : null}
      <TextField id="displayName" label="Display name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

      <div className="border-t border-rule pt-space-4">
        <p className="text-label text-ink-muted">Change password</p>
        <div className="mt-space-3 space-y-space-3">
          <TextField
            id="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            optional
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            id="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            optional
            minLength={12}
            hint="At least 12 characters — leave blank to keep your current password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            optional
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" variant="primary" loading={submitting}>
        Save changes
      </Button>
    </form>
  );
}
