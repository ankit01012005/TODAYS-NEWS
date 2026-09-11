"use client";

import { FormEvent, useState } from "react";
import { SourceView } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { TextField } from "./TextField";

/// PG-ADM-08+09 combined. Any signed-in staff member can list sources
/// (docs/10 A-12), so creating is open to this page's viewer regardless of
/// role — verify/edit/deactivate below are the admin-only actions
/// (backend enforces this either way via source:manage).
export function SourcesManager({ sources: initialSources }: { sources: SourceView[] }) {
  const [sources, setSources] = useState(initialSources);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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
      setSources((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setDescription("");
    } finally {
      setCreating(false);
    }
  }

  function replace(updated: SourceView) {
    setSources((list) => list.map((s) => (s.id === updated.id ? updated : s)));
  }

  function remove(id: string) {
    setSources((list) => list.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-space-6">
      {error ? <Alert variant="danger" title={error} /> : null}

      <form onSubmit={handleCreate} className="max-w-md space-y-space-3 rounded-md border border-rule p-space-4">
        <h2 className="text-label text-ink-muted">Add a source</h2>
        <TextField id="source-name" label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
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
        <Button type="submit" variant="primary" loading={creating}>
          Add source
        </Button>
      </form>

      <div className="rounded-md border border-rule">
        {sources.length > 0 ? (
          sources.map((source) => <SourceRow key={source.id} source={source} onChanged={replace} onDeactivated={remove} />)
        ) : (
          <p className="px-space-4 py-space-5 text-body-sm text-ink-muted">No sources yet.</p>
        )}
      </div>
    </div>
  );
}

function SourceRow({
  source,
  onChanged,
  onDeactivated,
}: {
  source: SourceView;
  onChanged: (source: SourceView) => void;
  onDeactivated: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(source.name);
  const [description, setDescription] = useState(source.description ?? "");
  const [url, setUrl] = useState(source.url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/sources/${source.id}/deactivate`, { method: "PATCH" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      onDeactivated(source.id);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-space-2 border-b border-rule px-space-4 py-space-3 last:border-b-0">
        {error ? <Alert variant="danger" title={error} /> : null}
        <TextField id={`edit-name-${source.id}`} label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          id={`edit-description-${source.id}`}
          label="Description"
          optional
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          id={`edit-url-${source.id}`}
          label="Link"
          optional
          type="url"
          hint="http(s) only; leave empty to remove"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
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
    <div className="flex flex-wrap items-center gap-x-space-4 gap-y-space-2 border-b border-rule px-space-4 py-space-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-body text-ink">
          {source.name}
          {source.verified ? <span className="ml-space-2 text-body-sm text-success">Verified</span> : null}
        </p>
        {source.description ? <p className="text-meta text-ink-muted">{source.description}</p> : null}
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="link-underline mt-space-1 inline-block break-all text-meta text-ink-secondary"
          >
            {source.url}
          </a>
        ) : null}
        {error ? <p className="mt-space-1 text-body-sm text-danger">{error}</p> : null}
      </div>
      <Button type="button" variant="tertiary" size="sm" disabled={busy} onClick={() => setEditing(true)}>
        Edit
      </Button>
      {!source.verified ? (
        <Button type="button" variant="secondary" size="sm" loading={busy} onClick={handleVerify}>
          Mark verified
        </Button>
      ) : null}
      <ConfirmAction
        label="Deactivate"
        confirmLabel="This source stays on published citations but won't be offered for new ones."
        variant="destructive"
        loading={busy}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
