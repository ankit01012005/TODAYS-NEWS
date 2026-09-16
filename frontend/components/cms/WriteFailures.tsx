"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw } from "lucide-react";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { TextField } from "./TextField";
import { useToast } from "./Toast";

/// 2t "Stale version — the important one". Someone else changed this
/// record since it was loaded; nothing was saved. Reload to see their
/// change — or copy the text on screen first so nothing is lost.
export function StaleVersionNotice({
  loadedVersion,
  textToCopy,
  onReload,
}: {
  loadedVersion?: number;
  /// Whatever the person has typed, joined into plain text — offered to
  /// the clipboard before they reload.
  textToCopy?: () => string;
  onReload?: () => void;
}) {
  const router = useRouter();
  const { success, error } = useToast();

  async function copy() {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy());
      success("Copied", "Your text is on the clipboard. Reload, then paste it back.");
    } catch {
      error("Couldn’t copy", "Select the text and copy it by hand before reloading.");
    }
  }

  return (
    <div role="alert" className="enter-rise border border-danger bg-danger-wash p-space-4">
      <p className="text-heading-4 text-ink">Someone else changed this</p>
      <p className="mt-space-1 text-body-sm text-ink">
        {typeof loadedVersion === "number" ? `Your copy is from version ${loadedVersion}; ` : ""}
        the current one is newer. Nothing was saved. Reload to see their change, then re-apply yours.
      </p>
      <div className="mt-space-3 flex flex-wrap gap-space-2">
        <Button
          variant="primary"
          size="sm"
          icon={<RefreshCw size={13} />}
          onClick={() => {
            if (onReload) onReload();
            else router.refresh();
          }}
        >
          Reload
        </Button>
        {textToCopy ? (
          <Button variant="secondary" size="sm" icon={<Copy size={13} />} onClick={copy}>
            Copy my text first
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/// 2t "Signed out mid-edit". The session expired; the draft text is
/// still on screen. Sign in again in this dialog — the cookie is set on
/// this tab, the dialog closes, and the caller retries what it was doing.
/// Not dismissible: closing it would be the same as losing the draft.
export function SessionExpiredDialog({
  open,
  onSignedIn,
}: {
  open: boolean;
  onSignedIn: (user: AuthenticatedUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { success } = useToast();

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
      setPassword("");
      success("Signed in again", "Your draft is still here — saving it now.");
      onSignedIn(user);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => undefined} title="Your session expired" eyebrow="Signed out mid-edit" dismissible={false} width="sm">
      <Alert variant="attention" title="Your draft text is still on screen">
        Sign in again here and it will be saved after you do. Don’t close this tab.
      </Alert>
      <form onSubmit={handleSubmit} className="mt-space-4 space-y-space-3">
        {error ? <Alert variant="danger" title={error} /> : null}
        <TextField id="reauth-email" label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          id="reauth-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" loading={submitting} loadingLabel="Signing in…" className="w-full">
          Sign in and keep going
        </Button>
      </form>
    </Dialog>
  );
}
