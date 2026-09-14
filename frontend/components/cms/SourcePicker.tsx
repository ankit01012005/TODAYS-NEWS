"use client";

import { KeyboardEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ShieldCheck, X } from "lucide-react";
import { ArticleSourceView, SourceView } from "@/lib/api/cms-types";
import { clientFetch, readWriteFailure, WriteFailure } from "@/lib/api/client-fetch";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Pill } from "./StatusBadge";
import { FIELD_CLASS, TextField } from "./TextField";

/// 1j's "SOURCES" card. Attach/detach act immediately against their own
/// endpoints, so this component owns its own server calls rather than
/// routing them through the editor's explicit Save. It lives INSIDE the
/// editor's <form>, so it must not render a <form> of its own — the
/// attach action is a plain button, with Enter wired to the same handler.
///
/// A citation change is a change to the revision: every call carries the
/// version the editor last saw and hands the bumped one back through
/// `onVersionChange`, so the next Save doesn't trip the stale check on its
/// own earlier attach. A 409/401 is handed up through `onFailure` so the
/// editor can show the stale/session panels it already has.
export function SourcePicker({
  articleId,
  attached,
  available,
  disabled,
  version,
  onVersionChange,
  onFailure,
}: {
  articleId: string;
  attached: ArticleSourceView[];
  available: SourceView[];
  disabled?: boolean;
  version: number;
  onVersionChange: (version: number) => void;
  onFailure?: (failure: WriteFailure) => void;
}) {
  const [items, setItems] = useState(attached);
  const [adding, setAdding] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const attachedIds = new Set(items.map((i) => i.sourceId));
  const choices = available.filter((s) => !attachedIds.has(s.id));

  function fail(failure: WriteFailure) {
    if (failure.kind === "error") setError(failure.message);
    else onFailure?.(failure);
  }

  async function handleAttach() {
    if (!selectedSourceId || busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/articles/${articleId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          sourceId: selectedSourceId,
          position: items.length,
          isPublic,
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        fail(await readWriteFailure(res));
        return;
      }
      const created = (await res.json()) as ArticleSourceView & { revisionVersion: number };
      onVersionChange(created.revisionVersion);
      setItems([...items, created]);
      setSelectedSourceId("");
      setNote("");
      setIsPublic(true);
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDetach(articleSourceId: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(
        `/articles/${articleId}/sources/${articleSourceId}?version=${encodeURIComponent(version)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        fail(await readWriteFailure(res));
        return;
      }
      const result = (await res.json()) as { revisionVersion: number };
      onVersionChange(result.revisionVersion);
      setItems(items.filter((i) => i.id !== articleSourceId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-space-2">
      {error ? <Alert variant="danger" title={error} /> : null}
      {items.length > 0 ? (
        <ul className="divide-y divide-rule">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-x-space-2 py-space-2">
              {item.source.verified ? (
                <Pill tone="success">
                  <ShieldCheck size={11} aria-hidden="true" /> verified
                </Pill>
              ) : (
                <Pill tone="muted">unverified</Pill>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-sm text-ink">{item.source.name}</span>
                {item.note ? <span className="block truncate text-caption text-ink-muted">{item.note}</span> : null}
              </span>
              <span className="shrink-0 text-caption text-ink-muted">{item.isPublic ? "public" : "hidden"}</span>
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => handleDetach(item.id)}
                  disabled={busy}
                  aria-label={`Remove ${item.source.name}`}
                  className="grid h-6 w-6 shrink-0 place-items-center text-ink-faint transition-colors hover:text-danger"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-caption text-ink-muted">No sources attached yet.</p>
      )}

      {!disabled ? (
        <>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              disabled={choices.length === 0}
              className="inline-flex items-center gap-x-space-1 text-body-sm text-brand disabled:text-ink-faint"
            >
              <Plus size={13} aria-hidden="true" />
              {choices.length === 0 ? "every source is attached" : "add a source"}
            </button>
          ) : null}
          <AnimatePresence initial={false}>
            {adding ? (
              <motion.div
                role="group"
                aria-label="Attach a source"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
                onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                  // Enter inside this group attaches the source rather than
                  // submitting the surrounding article form (Save).
                  if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
                    e.preventDefault();
                    void handleAttach();
                  }
                }}
              >
                <div className="space-y-space-2 border border-rule bg-surface-sunken p-space-3">
                  <select
                    aria-label="Source"
                    className={`h-9 ${FIELD_CLASS} border-rule-strong text-body-sm`}
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    autoFocus
                  >
                    <option value="">Choose a source…</option>
                    {choices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.verified ? " ✓" : ""}
                      </option>
                    ))}
                  </select>
                  <TextField id="source-note" label="Note" optional value={note} onChange={(e) => setNote(e.target.value)} className="!h-9 text-body-sm" />
                  <label className="inline-flex items-center gap-x-space-2 text-caption text-ink-secondary">
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-[#C81E1E]" />
                    Show to readers
                  </label>
                  <div className="flex gap-x-space-2">
                    <Button type="button" variant="primary" size="sm" loading={busy} disabled={!selectedSourceId} onClick={handleAttach}>
                      Attach
                    </Button>
                    <Button type="button" variant="tertiary" size="sm" disabled={busy} onClick={() => setAdding(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <p className="text-mono-sm text-ink-faint">editors create sources · only admins verify</p>
        </>
      ) : null}
    </div>
  );
}
