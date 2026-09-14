"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Plus } from "lucide-react";
import { SocialPickView } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { SOCIAL_PLATFORM_LABEL } from "@/lib/social-platform";
import { formatRelative } from "@/lib/format-date";
import { SocialGlyph, glyphForPlatform } from "@/components/brand/SocialGlyph";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { ListFrame, PageHeader, CmsEmpty } from "./Panel";
import { Pill } from "./StatusBadge";
import { SelectField, TextField } from "./TextField";
import { useToast } from "./Toast";

/// 2q — "Top on social", the front page, unreviewed. Hand-picked; no
/// automation, no platform API. These go live immediately — a pick
/// reaches the front page without passing through review, which is why
/// only an admin can add one. Newest first; the front page shows the
/// newest five.
export function SocialPicksManager({ picks: initialPicks }: { picks: SocialPickView[] }) {
  const [picks, setPicks] = useState(initialPicks);
  const [adding, setAdding] = useState(initialPicks.length === 0);
  const [platform, setPlatform] = useState<SocialPickView["platform"]>("INSTAGRAM");
  const [accountHandle, setAccountHandle] = useState("");
  const [headline, setHeadline] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { success } = useToast();

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await clientFetch("/social-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, accountHandle, headline, url }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const created = (await res.json()) as SocialPickView;
      setPicks((list) => [created, ...list]);
      success("On the front page.", "The pick is live in “Top on social” now.");
      setAccountHandle("");
      setHeadline("");
      setUrl("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-space-5">
      <PageHeader
        title="Top on social"
        lede="Hand-picked. No automation, no platform API."
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
            Add a pick
          </Button>
        }
      />

      <Alert variant="danger" title="These go live immediately.">
        A pick reaches the front page without passing through review — that is why only an admin can add one.
      </Alert>

      <AnimatePresence initial={false}>
        {adding ? (
          <motion.form
            onSubmit={handleAdd}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-space-3 border border-ink bg-paper p-space-4">
              <p className="text-label text-ink">Add a pick</p>
              {error ? <Alert variant="danger" title={error} /> : null}
              <div className="grid grid-cols-1 gap-space-2 sm:grid-cols-[150px_1fr]">
                <SelectField id="pick-platform" label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value as SocialPickView["platform"])}>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="X">X</option>
                  <option value="OTHER">Other</option>
                </SelectField>
                <TextField id="pick-handle" label="Account" required placeholder="@handle" value={accountHandle} onChange={(e) => setAccountHandle(e.target.value)} />
              </div>
              <TextField
                id="pick-headline"
                label="Headline readers will see"
                labelNote="you write this, not the post"
                required
                minLength={3}
                maxLength={200}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
              <TextField
                id="pick-url"
                label="Post URL"
                required
                type="url"
                placeholder="https://instagram.com/p/…"
                hint="http(s) only. Readers open it in a new tab."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <div className="flex gap-x-space-2">
                <Button type="submit" variant="primary" loading={saving}>
                  Add to the front page
                </Button>
                <Button type="button" variant="tertiary" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>

      <ListFrame>
        {picks.length === 0 ? (
          <div className="p-space-4">
            <CmsEmpty title="Nothing picked yet" body="The rail stays hidden on the front page until there is a pick." />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {picks.map((pick, index) => (
              <PickRow key={pick.id} pick={pick} position={index + 1} onRemoved={(id) => setPicks((list) => list.filter((p) => p.id !== id))} />
            ))}
          </AnimatePresence>
        )}
      </ListFrame>
      <p className="text-mono-sm text-ink-faint">platform is an enum — Instagram, X, Other — so the front page can always show a glyph</p>
    </div>
  );
}

function PickRow({ pick, position, onRemoved }: { pick: SocialPickView; position: number; onRemoved: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { info } = useToast();

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/social-picks/${pick.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        setError(await readErrorMessage(res));
        return;
      }
      onRemoved(pick.id);
      info("Pick removed.", "It is off the front page.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap items-start gap-x-space-3 gap-y-space-2 border-b border-rule px-space-4 py-space-3 last:border-b-0"
    >
      <span className="w-6 pt-[3px] text-mono-sm text-ink-muted">{position}</span>
      <Pill tone="gold">
        <SocialGlyph platform={glyphForPlatform(pick.platform)} size={11} />
        {SOCIAL_PLATFORM_LABEL[pick.platform]}
      </Pill>
      <div className="min-w-0 flex-1">
        <p className="text-heading-4 text-ink">{pick.headline}</p>
        <a
          href={pick.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-space-1 inline-flex max-w-full items-center gap-x-space-1 break-all text-mono-sm text-ink-muted no-underline hover:text-ink hover:underline"
        >
          {pick.accountHandle} · {pick.url} <ExternalLink size={11} aria-hidden="true" />
        </a>
        <p className="mt-space-1 text-caption text-ink-faint">added {formatRelative(pick.createdAt)}</p>
        {error ? <p className="mt-space-1 text-body-sm text-danger">{error}</p> : null}
      </div>
      <ConfirmAction
        label="Remove"
        confirmLabel="Take it off the front page?"
        variant="tertiary"
        size="sm"
        loading={busy}
        onConfirm={remove}
      />
    </motion.div>
  );
}
