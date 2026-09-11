"use client";

import { FormEvent, useState } from "react";
import { InvitationResult, StaffUserView, UserRole } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { TextField } from "./TextField";

/// PG-ADM-06+07 combined into one page (docs/10 P2-04: "one page with a
/// role filter... same capability, half the screens"). Invite, role
/// change, deactivate/reactivate all act immediately against their own
/// endpoints, mirroring SourcePicker's (5C) self-contained-writes pattern.
export function UsersManager({ users: initialUsers, currentUserId }: { users: StaffUserView[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("EDITOR");
  const [outcome, setOutcome] = useState<InvitationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  function upsertUser(updated: StaffUserView) {
    setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOutcome(null);
    setInviting(true);
    try {
      const res = await clientFetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, role }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const created = (await res.json()) as InvitationResult;
      setUsers((list) => [...list, created.user]);
      setOutcome(created);
      setEmail("");
      setDisplayName("");
      setRole("EDITOR");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-space-6">
      {error ? <Alert variant="danger" title={error} /> : null}

      <form onSubmit={handleInvite} className="max-w-md space-y-space-3 rounded-md border border-rule p-space-4">
        <h2 className="text-label text-ink-muted">Invite someone</h2>
        <TextField id="invite-email" label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          id="invite-name"
          label="Display name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <div>
          <label htmlFor="invite-role" className="text-label text-ink-muted">
            Role
          </label>
          <select
            id="invite-role"
            className="mt-1 h-10 w-full rounded-sm border border-rule-strong px-space-3 text-body text-ink"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <Button type="submit" variant="primary" loading={inviting}>
          Send invitation
        </Button>
        {outcome ? <InvitationOutcome outcome={outcome} /> : null}
      </form>

      <div className="rounded-md border border-rule">
        {users.map((user) => (
          <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} onChanged={upsertUser} />
        ))}
      </div>
    </div>
  );
}

/// What happened to the invitation email. The link is shown only when the
/// API is on its development console transport (it never sends one
/// otherwise) — a real deployment shows only "sent" or "couldn't send".
function InvitationOutcome({ outcome }: { outcome: InvitationResult }) {
  if (!outcome.emailDelivered) {
    return (
      <Alert variant="attention" title={`The account exists, but the email to ${outcome.user.email} couldn’t be sent`}>
        Check the mail configuration, then use <em>Resend invitation</em> on their row below.
      </Alert>
    );
  }
  return (
    <Alert variant="success" title={`Invitation sent to ${outcome.user.email}`}>
      {outcome.invitationLink ? (
        <>
          <p className="mb-space-1">
            Development mode &mdash; the API printed the email to its console instead of sending it. The link inside it:
          </p>
          <code className="block break-all rounded-sm bg-surface px-space-2 py-space-1 text-meta">
            {outcome.invitationLink}
          </code>
        </>
      ) : (
        <p>
          It works for 7 days. If it doesn&rsquo;t arrive, use <em>Resend invitation</em> on their row below.
        </p>
      )}
    </Alert>
  );
}

function UserRow({
  user,
  isSelf,
  onChanged,
}: {
  user: StaffUserView;
  isSelf: boolean;
  onChanged: (user: StaffUserView) => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState<InvitationResult | null>(null);
  const pendingRoleChange = role !== user.role;

  async function resendInvitation() {
    setError(null);
    setResent(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/users/${user.id}/resend-invitation`, { method: "POST" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const result = (await res.json()) as InvitationResult;
      setResent(result);
      onChanged(result.user);
    } finally {
      setBusy(false);
    }
  }

  async function commitRoleChange() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        setRole(user.role);
        return;
      }
      onChanged((await res.json()) as StaffUserView);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    setError(null);
    setBusy(true);
    try {
      const path = user.status === "ACTIVE" ? "deactivate" : "reactivate";
      const res = await clientFetch(`/users/${user.id}/${path}`, { method: "PATCH" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      onChanged((await res.json()) as StaffUserView);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-space-4 gap-y-space-2 border-b border-rule px-space-4 py-space-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-body text-ink">
          {user.displayName}
          {isSelf ? " (you)" : ""}
        </p>
        <p className="text-meta text-ink-muted">{user.email}</p>
        {error ? <p className="mt-space-1 text-body-sm text-danger">{error}</p> : null}
        {resent ? (
          <div className={`mt-space-1 text-body-sm ${resent.emailDelivered ? "text-success" : "text-danger"}`}>
            {resent.emailDelivered
              ? "Invitation re-sent."
              : "The email couldn’t be sent — check the mail configuration."}
            {resent.invitationLink ? (
              <code className="mt-space-1 block break-all rounded-sm bg-surface px-space-2 py-space-1 text-meta text-ink">
                {resent.invitationLink}
              </code>
            ) : null}
          </div>
        ) : null}
      </div>

      <span
        className={`shrink-0 rounded-pill px-space-3 py-0.5 text-meta ${
          user.status !== "ACTIVE"
            ? "bg-surface-sunken text-ink-muted"
            : user.invitationPending
              ? "bg-attention-wash text-ink-secondary"
              : "bg-success-wash text-ink-secondary"
        }`}
      >
        {user.status !== "ACTIVE" ? "Deactivated" : user.invitationPending ? "Invitation pending" : "Active"}
      </span>

      {user.status === "ACTIVE" && user.invitationPending && !isSelf ? (
        <Button type="button" variant="secondary" size="sm" loading={busy} onClick={resendInvitation}>
          Resend invitation
        </Button>
      ) : null}

      <select
        className="h-9 shrink-0 rounded-sm border border-rule-strong px-space-2 text-body-sm text-ink"
        disabled={isSelf || busy}
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
      >
        <option value="EDITOR">Editor</option>
        <option value="ADMIN">Admin</option>
      </select>

      {pendingRoleChange ? (
        <ConfirmAction
          label="Change role"
          confirmLabel={`Change ${user.displayName} to ${role === "ADMIN" ? "Admin" : "Editor"}?`}
          variant="secondary"
          loading={busy}
          onConfirm={commitRoleChange}
        />
      ) : null}

      {!isSelf ? (
        <ConfirmAction
          label={user.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
          confirmLabel={
            user.status === "ACTIVE" ? `${user.displayName}'s sessions will end immediately.` : "Restore this account?"
          }
          variant={user.status === "ACTIVE" ? "destructive" : "secondary"}
          loading={busy}
          onConfirm={toggleActive}
        />
      ) : null}
    </div>
  );
}
