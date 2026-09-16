"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Plus, ShieldCheck } from "lucide-react";
import { SourceView } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { platformLabel } from "@/lib/social-platform";
import { formatRelative } from "@/lib/format-date";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { ListFrame, PageHeader, Panel, CmsEmpty } from "./Panel";
import { Pill } from "./StatusBadge";
import { Tabs } from "./Tabs";
import { TextField } from "./TextField";
import { useToast } from "./Toast";

type TabKey = "AWAITING" | "VERIFIED";

/// 2p — editors add, admins verify. Any signed-in staff member can list
/// and (editors) create; verify/edit/retire are the admin-only actions
/// (the backend enforces this via source:manage either way). Verifying
/// is a claim: it records who vouched and when, and readers see the badge.
export function SourcesManager({
  sources: initialSources,
  viewerRole,
  verifierNames = {},
}: {
  sources: SourceView[];
  viewerRole: "EDITOR" | "ADMIN";
  verifierNames?: Record<string, string>;
}) {
  const [sources, setSources] = useState(initialSources);
  const [adding, setAdding] = useState(viewerRole === "EDITOR" && initialSources.length === 0);
  const [active, setActive] = useState<TabKey>("AWAITING");
  const isAdmin = viewerRole === "ADMIN";

  const awaiting = useMemo(() => sources.filter((s) => !s.verified), [sources]);
  const verified = useMemo(() => sources.filter((s) => s.verified), [sources]);
  const rows = active === "AWAITING" ? awaiting : verified;

  function replace(updated: SourceView) {
    setSources((list) => list.map((s) => (s.id === updated.id ? updated : s)));
  }
  function remove(id: string) {
    setSources((list) => list.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-space-5">
      <PageHeader
        title="Sources"
        lede={isAdmin ? "Editors add them; you vouch for them. Verified sources carry the badge readers see." : "Add the people, offices and accounts your stories cite. An admin verifies them."}
        actions={
          !isAdmin ? (
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
              Add a source
            </Button>
          ) : null
        }
      />

      <AnimatePresence initial={false}>
        {adding && !isAdmin ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <AddSourceForm
              onCreated={(created) => {
                setSources((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
                setActive("AWAITING");
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div>
        <Tabs
          id="sources-tabs"
          items={[
            { key: "AWAITING", label: "Awaiting verification", count: awaiting.length },
            { key: "VERIFIED", label: "Verified", count: verified.length },
          ]}
          active={active}
          onChange={(key) => setActive(key as TabKey)}
        />
        <ListFrame className="border-t-0">
          {rows.length > 0 ? (
            rows.map((source) => (
              <SourceRow key={source.id} source={source} isAdmin={isAdmin} verifierNames={verifierNames} onChanged={replace} onRetired={remove} />
            ))
          ) : (
            <div className="p-space-4">
              <CmsEmpty
                title={active === "AWAITING" ? "Nothing awaiting verification." : "No verified sources yet."}
                body={
                  active === "AWAITING"
                    ? isAdmin
                      ? "When an editor adds a source it appears here for you to vouch for."
                      : "Add a source and it appears here until an admin verifies it."
                    : "Verify a source and it moves here — and its badge shows on every story that cites it."
                }
              />
            </div>
          )}
        </ListFrame>
      </div>

      <div className="grid grid-cols-1 gap-space-3 md:grid-cols-2">
        <Panel tone="success" heading="Verifying is a claim">
          <p className="text-body-sm text-ink">
            It records who vouched and when, and readers see the badge. Only admins can do it — an editor cannot
            verify their own source.
          </p>
        </Panel>
        <Panel tone="sunken" heading="On the story">
          <p className="text-body-sm text-ink">
            Each citation carries its own public/hidden flag and an optional note. Hidden ones are still recorded — they
            just don’t appear to readers.
          </p>
        </Panel>
      </div>
      <p className="text-mono-sm text-ink-faint">http(s) only, validated server-side · retired sources stay attached to the revisions that cited them</p>
    </div>
  );
}

function AddSourceForm({ onCreated, onCancel }: { onCreated: (source: SourceView) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { success } = useToast();

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await clientFetch("/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined, url: url || undefined }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const created = (await res.json()) as SourceView;
      success("Source added.", `${created.name} can be cited from any story now. An admin will verify it.`);
      setName("");
      setDescription("");
      setUrl("");
      onCreated(created);
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="space-y-space-3 border border-ink bg-paper p-space-4">
      <p className="text-label text-ink">Add a source</p>
      {error ? <Alert variant="danger" title={error} /> : null}
      <TextField id="source-name" label="Name" placeholder="District Relief Office, Nadia" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      <TextField id="source-description" label="Description" optional value={description} onChange={(e) => setDescription(e.target.value)} />
      <TextField
        id="source-url"
        label="Link"
        optional
        type="url"
        placeholder="https://x.com/account or a website"
        hint="Shown to readers as an outbound link. http(s) only."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <div className="flex gap-x-space-2">
        <Button type="submit" variant="primary" loading={creating}>
          Add source
        </Button>
        <Button type="button" variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SourceRow({
  source,
  isAdmin,
  verifierNames,
  onChanged,
  onRetired,
}: {
  source: SourceView;
  isAdmin: boolean;
  verifierNames: Record<string, string>;
  onChanged: (source: SourceView) => void;
  onRetired: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(source.name);
  const [description, setDescription] = useState(source.description ?? "");
  const [url, setUrl] = useState(source.url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, info } = useToast();
  const platform = source.url ? platformLabel(source.url) : null;
  const isSocial = platform === "X" || platform === "Instagram" || platform === "YouTube" || platform === "Facebook" || platform === "Threads";

  async function handleSave() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, url }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      onChanged((await res.json()) as SourceView);
      setEditing(false);
      success("Source saved.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/sources/${source.id}/verify`, { method: "POST" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      onChanged((await res.json()) as SourceView);
      success("Verified.", `${source.name} now shows the badge wherever it is cited.`);
    } finally {
      setBusy(false);
    }
  }

  async function handleRetire() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/sources/${source.id}/deactivate`, { method: "PATCH" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      onRetired(source.id);
      info("Source retired.", `${source.name} can no longer be attached to new stories.`);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-space-2 border-b border-rule bg-surface-sunken px-space-4 py-space-3 last:border-b-0">
        {error ? <Alert variant="danger" title={error} /> : null}
        <TextField id={`edit-name-${source.id}`} label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField id={`edit-description-${source.id}`} label="Description" optional value={description} onChange={(e) => setDescription(e.target.value)} />
        <TextField id={`edit-url-${source.id}`} label="Link" optional type="url" hint="http(s) only; leave empty to remove" value={url} onChange={(e) => setUrl(e.target.value)} />
        <div className="flex gap-x-space-2">
          <Button type="button" variant="primary" size="sm" loading={busy} onClick={handleSave}>
            Save
          </Button>
          <Button type="button" variant="tertiary" size="sm" disabled={busy} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-x-space-4 gap-y-space-2 border-b border-rule px-space-4 py-space-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-space-2 text-heading-4 text-ink">
          {source.name}
          {isSocial ? <Pill tone="muted">social account</Pill> : null}
          {source.verified ? (
            <Pill tone="success">
              <ShieldCheck size={11} aria-hidden="true" /> verified
            </Pill>
          ) : null}
        </p>
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-space-1 inline-flex max-w-full items-center gap-x-space-1 break-all text-mono-sm text-info no-underline hover:underline"
          >
            {source.url} <ExternalLink size={11} aria-hidden="true" />
          </a>
        ) : null}
        {source.description ? <p className="mt-space-1 text-body-sm text-ink-secondary">{source.description}</p> : null}
        <p className="mt-space-1 text-caption text-ink-muted">
          {source.verified && source.verifiedAt
            ? `Verified ${formatRelative(source.verifiedAt)}${source.verifiedByUserId && verifierNames[source.verifiedByUserId] ? ` by ${verifierNames[source.verifiedByUserId]}` : ""}`
            : "Awaiting verification"}
        </p>
        {error ? <p className="mt-space-1 text-body-sm text-danger">{error}</p> : null}
      </div>
      {isAdmin ? (
        <div className="flex shrink-0 flex-col items-stretch gap-y-space-2">
          {!source.verified ? (
            <Button type="button" variant="success" size="sm" icon={<ShieldCheck size={13} />} loading={busy} onClick={handleVerify}>
              Verify
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => setEditing(true)}>
            Edit
          </Button>
          <ConfirmAction
            label="Retire"
            confirmLabel="Retire this source?"
            detail="It stays on published citations but won’t be offered for new ones."
            variant="tertiary"
            size="sm"
            loading={busy}
            onConfirm={handleRetire}
          />
        </div>
      ) : null}
    </div>
  );
}
