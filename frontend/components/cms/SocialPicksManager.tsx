"use client";

import { FormEvent, useState } from "react";
import { SocialPickView } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { SOCIAL_PLATFORM_LABEL } from "@/lib/social-platform";
import { formatRelative } from "@/lib/format-date";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { TextField } from "./TextField";

/// The daily hand-curation surface for the front page's "Top on social"
/// rail. Add a post (platform, account, the headline readers will see,
/// the post's address); remove yesterday's. Newest first; the front page
/// shows the newest eight. Admin-only (social:manage) — a pick publishes
/// straight to the front page, and publishing is the admin's job.
export function SocialPicksManager({ picks: initialPicks }: { picks: SocialPickView[] }) {
  const [picks, setPicks] = useState(initialPicks);
  const [platform, setPlatform] = useState<SocialPickView["platform"]>("X");
  const [accountHandle, setAccountHandle] = useState("");
  const [headline, setHeadline] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      setAccountHandle("");
      setHeadline("");
      setUrl("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-space-6">
      <form onSubmit={handleAdd} className="max-w-xl space-y-space-3 rounded-md border border-rule bg-paper p-space-4">
        <h2 className="text-label text-ink-muted">Add today&rsquo;s pick</h2>
        {error ? <Alert variant="danger" title={error} /> : null}
        <div>
          <label htmlFor="pick-platform" className="text-label text-ink-muted">
            Platform
          </label>
          <select
            id="pick-platform"
            className="mt-1 h-10 w-full rounded-sm border border-rule-strong bg-paper px-space-3 text-body text-ink"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as SocialPickView["platform"])}
          >
            <option value="X">X (Twitter)</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="OTHER">Elsewhere</option>
          </select>
        </div>
        <TextField
          id="pick-handle"
          label="Account"
          required
          placeholder="@handle"
          value={accountHandle}
          onChange={(e) => setAccountHandle(e.target.value)}
        />
        <TextField
          id="pick-headline"
          label="Headline"
          required
          minLength={3}
          maxLength={200}
          hint="What the front page shows — write it, don’t paste the post."
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
        <TextField
          id="pick-url"
          label="Post link"
          required
          type="url"
          placeholder="https://x.com/account/status/…"
          hint="http(s) only. Readers open it in a new tab."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button type="submit" variant="primary" loading={saving}>
          Add to the front page
        </Button>
      </form>

      <div className="overflow-hidden rounded-md border border-rule bg-paper">
        {picks.length === 0 ? (
          <p className="px-space-4 py-space-5 text-body-sm text-ink-muted">
            Nothing picked yet — the rail stays hidden on the front page until there is.
          </p>
        ) : (
          picks.map((pick) => (
            <PickRow
              key={pick.id}
              pick={pick}
              onRemoved={(id) => setPicks((list) => list.filter((p) => p.id !== id))}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PickRow({ pick, onRemoved }: { pick: SocialPickView; onRemoved: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-space-4 gap-y-space-2 border-b border-rule px-space-4 py-space-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-meta text-ink-muted">
          {SOCIAL_PLATFORM_LABEL[pick.platform]} · {pick.accountHandle} · {formatRelative(pick.createdAt)}
        </p>
        <p className="text-body text-ink">{pick.headline}</p>
        <a
          href={pick.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="link-underline inline-block break-all text-meta text-ink-secondary"
        >
          {pick.url}
        </a>
        {error ? <p className="mt-space-1 text-body-sm text-danger">{error}</p> : null}
      </div>
      <ConfirmAction
        label="Remove"
        confirmLabel="Take it off the front page?"
        variant="destructive"
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
