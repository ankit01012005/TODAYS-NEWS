"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { Avatar } from "@/components/public/Avatar";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Pill } from "./StatusBadge";
import { StrengthMeter } from "./SetPasswordForm";
import { TextField } from "./TextField";
import { useToast } from "./Toast";

/// 2n — display name ("this is your byline") and email at the top; a
/// separate password form beneath that says, before they click, that a
/// change signs them out everywhere else. Both call PATCH /auth/me. No
/// self-role-change control exists — the capability doesn't.
export function ProfileForm({ user }: { user: AuthenticatedUser }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const { success } = useToast();
  const router = useRouter();

  async function handleName(e: FormEvent) {
    e.preventDefault();
    setNameError(null);
    setSavingName(true);
    try {
      const res = await clientFetch("/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        setNameError(await readErrorMessage(res));
        return;
      }
      success("Profile saved.", "Your byline updates on the stories you publish from now on.");
      router.refresh();
    } finally {
      setSavingName(false);
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords don’t match.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await clientFetch("/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        setPasswordError(await readErrorMessage(res));
        return;
      }
      success("Password changed.", "Every other session you had open has been signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-[460px]">
      <div className="flex items-center gap-x-space-4">
        <Avatar name={user.displayName} size={52} />
        <div className="min-w-0">
          <h1 className="text-heading-2 text-ink">{user.displayName}</h1>
          <p className="mt-space-1 flex flex-wrap items-center gap-x-space-2 text-mono-sm text-ink-muted">
            <span className="truncate">{user.email}</span>
            <Pill tone={user.role === "ADMIN" ? "brand" : "muted"}>{user.role === "ADMIN" ? "Admin" : "Editor"}</Pill>
          </p>
        </div>
      </div>

      <form onSubmit={handleName} className="mt-space-6 space-y-space-3">
        {nameError ? <Alert variant="danger" title={nameError} /> : null}
        <TextField
          id="displayName"
          label="Display name — this is your byline"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <TextField id="email" label="Email" value={user.email} readOnly disabled hint="Ask the newsroom admin to change the address you sign in with." />
        <Button type="submit" variant="secondary" loading={savingName} disabled={displayName.trim() === user.displayName.trim()}>
          Save changes
        </Button>
      </form>

      <form onSubmit={handlePassword} className="mt-space-7 space-y-space-3 border-t border-rule pt-space-5">
        <p className="text-label text-ink-muted">Change password</p>
        {passwordError ? <Alert variant="danger" title={passwordError} /> : null}
        <TextField
          id="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <TextField
          id="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <StrengthMeter password={newPassword} />
        <TextField
          id="confirmPassword"
          label="Repeat new password"
          type="password"
          autoComplete="new-password"
          required
          error={confirmPassword && confirmPassword !== newPassword ? "Doesn’t match yet" : undefined}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" loading={savingPassword} disabled={!currentPassword || newPassword.length < 12}>
          Change password
        </Button>
        <p className="text-mono-sm text-ink-faint">changing it signs you out everywhere else — this tab stays signed in</p>
      </form>
    </div>
  );
}
