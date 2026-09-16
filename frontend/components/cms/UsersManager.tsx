"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { InvitationResult, StaffUserView, UserRole } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { formatPublicDateShort, formatRelative } from "@/lib/format-date";
import { Avatar } from "@/components/public/Avatar";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { Dialog } from "./Dialog";
import { ListFrame, PageHeader, Panel } from "./Panel";
import { Pill } from "./StatusBadge";
import { SelectField, TextField } from "./TextField";
import { useToast } from "./Toast";

/// 2r — staff & roles, with the invite dialog. Invite, role change,
/// deactivate/reactivate and resend all act immediately against their
/// own endpoints. The three rules the UI carries: exactly one active
/// admin, always (the last one cannot be demoted or deactivated — those
/// controls are disabled with the reason shown); nobody is deleted, only
/// deactivated; deactivating revokes their sessions immediately.
export function UsersManager({ users: initialUsers, currentUserId }: { users: StaffUserView[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [outcome, setOutcome] = useState<InvitationResult | null>(null);

  const activeAdmins = useMemo(() => users.filter((u) => u.role === "ADMIN" && u.status === "ACTIVE"), [users]);
  const counts = useMemo(
    () => ({
      admins: users.filter((u) => u.role === "ADMIN" && u.status === "ACTIVE").length,
      editors: users.filter((u) => u.role === "EDITOR" && u.status === "ACTIVE" && !u.invitationPending).length,
      pending: users.filter((u) => u.status === "ACTIVE" && u.invitationPending).length,
    }),
    [users],
  );

  function upsertUser(updated: StaffUserView) {
    setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
  }

  const ordered = useMemo(
    () =>
      [...users].sort((a, b) => {
        const rank = (u: StaffUserView) => (u.status !== "ACTIVE" ? 3 : u.invitationPending ? 2 : u.role === "ADMIN" ? 0 : 1);
        return rank(a) - rank(b) || a.displayName.localeCompare(b.displayName);
      }),
    [users],
  );

  return (
    <div className="space-y-space-5">
      <PageHeader
        title="Staff"
        lede={`${counts.admins} admin · ${counts.editors} editor${counts.editors === 1 ? "" : "s"}${counts.pending > 0 ? ` · ${counts.pending} invitation${counts.pending === 1 ? "" : "s"} pending` : ""}`}
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setInviteOpen(true)}>
            Invite someone
          </Button>
        }
      />

      {outcome ? <InvitationOutcome outcome={outcome} /> : null}

      <ListFrame>
        {ordered.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            isSelf={user.id === currentUserId}
            isLastAdmin={user.role === "ADMIN" && user.status === "ACTIVE" && activeAdmins.length === 1}
            onChanged={upsertUser}
          />
        ))}
      </ListFrame>

      <Panel tone="gold" heading="Three rules">
        <ul className="space-y-space-2 text-body-sm text-ink">
          <li>
            There must always be exactly one active admin — the last one cannot be demoted or deactivated, so those
            controls are disabled on that row with the reason shown.
          </li>
          <li>Nobody is deleted, only deactivated; their bylines stay on published stories.</li>
          <li>Deactivating revokes their sessions immediately.</li>
        </ul>
      </Panel>

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(result) => {
          setUsers((list) => [...list, result.user]);
          setOutcome(result);
          setInviteOpen(false);
        }}
      />
    </div>
  );
}

function InviteDialog({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: (result: InvitationResult) => void;
}) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const { success, error: toastError } = useToast();

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
      if (created.emailDelivered) {
        success("Invitation sent.", `${created.user.email} has 7 days to choose a password.`);
      } else {
        toastError("Account created, but the email failed", "Check the mail configuration, then resend.");
      }
      setEmail("");
      setDisplayName("");
      setRole("EDITOR");
      onInvited(created);
    } finally {
      setInviting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Invite someone" eyebrow="Staff">
      <form onSubmit={handleInvite} className="space-y-space-3">
        {error ? <Alert variant="danger" title={error} /> : null}
        <TextField id="invite-email" label="Email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          id="invite-name"
          label="Display name"
          labelNote="becomes their byline"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <SelectField id="invite-role" label="Role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="EDITOR">Editor — writes and submits stories</option>
          <option value="ADMIN">Admin — reviews, publishes, runs the newsroom</option>
        </SelectField>
        <p className="text-body-sm text-ink-muted">They get a single-use link to choose their own password. You never set one for them.</p>
        <Button type="submit" variant="primary" loading={inviting} loadingLabel="Sending…" className="w-full">
          Send invitation
        </Button>
      </form>
    </Dialog>
  );
}

/// What happened to the invitation email. The link is shown only when the
/// API is on its development console transport (it never sends one
/// otherwise) — a real deployment shows only "sent" or "couldn't send".
function InvitationOutcome({ outcome }: { outcome: InvitationResult }) {
  if (!outcome.emailDelivered) {
    return (
      <Alert variant="attention" title={`The account exists, but the email to ${outcome.user.email} couldn’t be sent`}>
        Check the mail configuration, then use <em>Resend</em> on their row below.
      </Alert>
    );
  }
  return (
    <Alert variant="success" title={`Invitation sent to ${outcome.user.email}`}>
      {outcome.invitationLink ? (
        <>
          <p className="mb-space-1">Development mode — the API printed the email to its console instead of sending it. The link inside it:</p>
          <code className="block break-all border border-rule bg-surface-sunken px-space-2 py-space-1 text-mono-sm text-ink">{outcome.invitationLink}</code>
        </>
      ) : (
        <p>It works for 7 days. If it doesn’t arrive, use <em>Resend</em> on their row below.</p>
      )}
    </Alert>
  );
}

function UserRow({
  user,
  isSelf,
  isLastAdmin,
  onChanged,
}: {
  user: StaffUserView;
  isSelf: boolean;
  isLastAdmin: boolean;
  onChanged: (user: StaffUserView) => void;
}) {
  const [managing, setManaging] = useState(false);
  const [role, setRole] = useState<UserRole>(user.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState<InvitationResult | null>(null);
  const pendingRoleChange = role !== user.role;
  const { success, info, error: toastError } = useToast();
  const deactivated = user.status !== "ACTIVE";
  const pending = !deactivated && user.invitationPending;
  const locked = isLastAdmin;

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
      if (result.emailDelivered) success("Invitation re-sent.", `A fresh link is on its way to ${user.email}.`);
      else toastError("The email could not be sent", "Check the mail configuration.");
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
      success("Role changed.", `${user.displayName} is now ${role === "ADMIN" ? "an admin" : "an editor"}.`);
      setManaging(false);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    setError(null);
    setBusy(true);
    try {
      const path = deactivated ? "reactivate" : "deactivate";
      const res = await clientFetch(`/users/${user.id}/${path}`, { method: "PATCH" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      onChanged((await res.json()) as StaffUserView);
      if (path === "deactivate") info("Account deactivated.", `${user.displayName} has been signed out everywhere.`);
      else success("Account reactivated.", `${user.displayName} can sign in again.`);
      setManaging(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`border-b border-rule last:border-b-0 ${pending ? "bg-gold-wash" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-space-3 gap-y-space-2 px-space-4 py-space-3">
        <Avatar name={pending ? user.email : user.displayName} size={32} tone={pending ? "dashed" : "ink"} className={deactivated ? "opacity-50" : ""} />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-heading-4 ${deactivated ? "text-ink-faint" : "text-ink"}`}>
            {pending ? user.email : user.displayName}
            {isSelf ? <span className="ml-space-1 text-caption font-normal text-ink-muted">· you</span> : null}
          </p>
          <p className={`mt-space-1 truncate text-mono-sm ${pending ? "text-gold-deep" : "text-ink-muted"}`}>
            {pending
              ? `invited ${formatPublicDateShort(user.createdAt)} · never signed in`
              : deactivated
                ? `deactivated · bylines kept on published stories`
                : `${user.email} · joined ${formatRelative(user.createdAt)}`}
          </p>
          {error ? <p className="mt-space-1 text-body-sm text-danger">{error}</p> : null}
          {resent ? (
            <div className={`mt-space-1 text-body-sm ${resent.emailDelivered ? "text-success" : "text-danger"}`}>
              {resent.emailDelivered ? "Invitation re-sent." : "The email couldn’t be sent — check the mail configuration."}
              {resent.invitationLink ? (
                <code className="mt-space-1 block break-all border border-rule bg-surface-sunken px-space-2 py-space-1 text-mono-sm text-ink">{resent.invitationLink}</code>
              ) : null}
            </div>
          ) : null}
        </div>
        <Pill tone={deactivated ? "muted" : user.role === "ADMIN" ? "brand" : "ink"}>{deactivated ? "Deactivated" : user.role === "ADMIN" ? "Admin" : "Editor"}</Pill>
        <span className="w-[76px] text-right">
          {locked ? (
            <span className="text-caption text-ink-faint" title="The last active admin can’t be changed">
              locked
            </span>
          ) : pending ? (
            <button type="button" onClick={resendInvitation} disabled={busy} className="text-body-sm text-gold-deep underline-offset-4 hover:underline disabled:opacity-60">
              {busy ? "Sending…" : "Resend"}
            </button>
          ) : deactivated ? (
            <button type="button" onClick={toggleActive} disabled={busy} className="text-body-sm text-brand underline-offset-4 hover:underline disabled:opacity-60">
              Reactivate
            </button>
          ) : (
            <button type="button" onClick={() => setManaging((v) => !v)} aria-expanded={managing} className="text-body-sm text-brand underline-offset-4 hover:underline">
              {managing ? "Close" : "Manage"}
            </button>
          )}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {managing && !locked && !deactivated ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-x-space-3 gap-y-space-2 border-t border-rule bg-surface-sunken px-space-4 py-space-3">
              <div className="w-44">
                <SelectField id={`role-${user.id}`} label="Role" disabled={isSelf || busy} value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </SelectField>
              </div>
              {pendingRoleChange ? (
                <ConfirmAction
                  label="Change role"
                  confirmLabel={`Make ${user.displayName} ${role === "ADMIN" ? "an admin" : "an editor"}?`}
                  detail={role === "ADMIN" ? "There can only be one active admin — this may be refused." : "They keep their stories, but lose review and management."}
                  variant="secondary"
                  size="sm"
                  loading={busy}
                  onConfirm={commitRoleChange}
                />
              ) : null}
              {!isSelf ? (
                <ConfirmAction
                  label="Deactivate"
                  confirmLabel={`Deactivate ${user.displayName}?`}
                  detail="Their sessions end immediately. Their bylines stay on published stories."
                  variant="destructive"
                  size="sm"
                  loading={busy}
                  onConfirm={toggleActive}
                />
              ) : (
                <p className="text-caption text-ink-muted">You can’t change your own role or deactivate yourself.</p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
