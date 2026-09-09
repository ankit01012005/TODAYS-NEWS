"use client";

import { FormEvent, useState } from "react";
import { ArticleSourceView, SourceView } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { TextField } from "./TextField";

/// Attach/detach act immediately against their own endpoints
/// (sources.router.ts's articleSourcesRouter — separate from
/// articlesRouter's Save), so this component owns its own server calls
/// rather than routing them through the editor's explicit Save.
export function SourcePicker({
  articleId,
  attached,
  available,
  disabled,
}: {
  articleId: string;
  attached: ArticleSourceView[];
  available: SourceView[];
  disabled?: boolean;
}) {
  const [items, setItems] = useState(attached);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const attachedIds = new Set(items.map((i) => i.sourceId));
  const choices = available.filter((s) => !attachedIds.has(s.id));

  async function handleAttach(e: FormEvent) {
    e.preventDefault();
    if (!selectedSourceId) return;
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/articles/${articleId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: selectedSourceId, position: items.length, isPublic, note: note || undefined }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const created = (await res.json()) as ArticleSourceView;
      setItems([...items, created]);
      setSelectedSourceId("");
      setNote("");
      setIsPublic(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleDetach(articleSourceId: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/articles/${articleId}/sources/${articleSourceId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        setError(await readErrorMessage(res));
        return;
      }
      setItems(items.filter((i) => i.id !== articleSourceId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-space-3">
      {error ? <Alert variant="danger" title={error} /> : null}
      {items.length > 0 ? (
        <ul className="space-y-space-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-sm border border-rule px-space-3 py-space-2">
              <div>
                <p className="text-body-sm text-ink">
                  {item.source.name}
                  {item.source.verified ? " ✓" : ""}
                </p>
                {item.note ? <p className="text-meta text-ink-muted">{item.note}</p> : null}
                <p className="text-meta text-ink-faint">{item.isPublic ? "Shown to readers" : "Internal only"}</p>
              </div>
              {!disabled ? (
                <button type="button" onClick={() => handleDetach(item.id)} disabled={busy} className="text-body-sm text-danger">
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-ink-muted">No sources attached yet.</p>
      )}
      {!disabled && choices.length > 0 ? (
        <form onSubmit={handleAttach} className="space-y-space-2 rounded-md border border-rule p-space-3">
          <select
            className="h-10 w-full rounded-sm border border-rule-strong px-space-3 text-body text-ink"
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
          >
            <option value="">Choose a source…</option>
            {choices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.verified ? " ✓" : ""}
              </option>
            ))}
          </select>
          <TextField label="Note" optional value={note} onChange={(e) => setNote(e.target.value)} />
          <label className="flex items-center gap-x-2 text-body-sm text-ink-secondary">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Show to readers
          </label>
          <Button type="submit" variant="secondary" size="sm" loading={busy} disabled={!selectedSourceId}>
            Attach source
          </Button>
        </form>
      ) : null}
    </div>
  );
}
