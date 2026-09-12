"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArticleDetailView,
  ArticleSourceView,
  CategoryView,
  MediaAssetView,
  RevisionHistoryEntryView,
  RevisionState,
  RevisionView,
  SourceView,
} from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { BodyBlock, parseBody } from "@/lib/api/body-blocks";
import { Alert } from "./Alert";
import { BodyEditor } from "./BodyEditor";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { FeaturedImagePicker, FeaturedImageValue } from "./FeaturedImagePicker";
import { FeedbackPanel } from "./FeedbackPanel";
import { SourcePicker } from "./SourcePicker";
import { StatusBadge } from "./StatusBadge";
import { TextAreaField, TextField } from "./TextField";

/// docs/26 §1.3 — the only two states a revision may still be written in.
/// Mirrors backend/src/articles/articles.service.ts's EDITABLE_STATES
/// exactly; the backend is the real enforcement point (a stale/bypassed
/// client still gets refused server-side), this only decides what the UI
/// offers.
const EDITABLE_STATES: RevisionState[] = ["DRAFT", "CHANGES_REQUESTED"];

interface FormState {
  headline: string;
  summary: string;
  body: BodyBlock[];
  seoTitle: string;
  seoDescription: string;
  categoryId: string;
  bylineOverride: string;
  featuredImage: FeaturedImageValue;
}

function toFormState(revision: RevisionView | null, article: ArticleDetailView): FormState {
  return {
    headline: revision?.headline ?? "",
    summary: revision?.summary ?? "",
    body: parseBody(revision?.body),
    seoTitle: revision?.seoTitle ?? "",
    seoDescription: revision?.seoDescription ?? "",
    // The revision's own section/byline (docs/27 A1) — the article-level
    // values are what is currently published, which may differ.
    categoryId: revision?.categoryId ?? article.categoryId,
    bylineOverride: revision?.bylineOverride ?? article.bylineOverride ?? "",
    featuredImage: {
      featuredImageId: revision?.featuredImageId ?? null,
      featuredImageAlt: revision?.featuredImageAlt ?? null,
      featuredImageCredit: revision?.featuredImageCredit ?? null,
      featuredImageCaption: revision?.featuredImageCaption ?? null,
    },
  };
}

/// The writing surface (docs/19 §4). One page covers PG-EDT-07/08/09 —
/// editable, waiting-for-review and read-only are all this same
/// component with different affordances, not separate routes, matching
/// docs/26 §1.3's editable-states rule already enforced server-side.
export function ArticleEditor({
  article,
  categories,
  media: initialMedia,
  sources,
  attachedSources,
  history,
  viewerRole,
}: {
  article: ArticleDetailView;
  categories: CategoryView[];
  media: MediaAssetView[];
  sources: SourceView[];
  attachedSources: ArticleSourceView[];
  history: RevisionHistoryEntryView[];
  viewerRole: "EDITOR" | "ADMIN";
}) {
  const router = useRouter();
  const latestHistoryRevision = history.at(-1) ?? null;
  const displayRevision: RevisionView | null = article.openRevision ?? article.publishedRevision ?? latestHistoryRevision;
  const isAdmin = viewerRole === "ADMIN";
  // Admin has no authoring capability at all (backend/src/common/capabilities.ts)
  // — these two can reach an admin viewer (assertOwnerOrAdmin lets admin open
  // any article to review it), so they must exclude admin explicitly rather
  // than relying on article state alone, unlike before admin could author too.
  const isEditable =
    !isAdmin && article.openRevision !== null && EDITABLE_STATES.includes(article.openRevision.state);
  const isInReview = article.openRevision?.state === "IN_REVIEW";
  const hasNoOpenRevision = article.openRevision === null;
  const canStartCorrection = !isAdmin && article.publicationStatus === "LIVE" && hasNoOpenRevision;
  // Admin-only recovery actions (docs/10 A-08/A-09, docs/11 T12/T14/T15/T16)
  // — each operates on the state a rejected/archived/live-with-no-draft
  // article is actually in, none of which are "editable" in the Save/
  // Submit sense above.
  const canWithdraw = isAdmin && article.publicationStatus === "LIVE" && hasNoOpenRevision;
  const canReopenOrArchive = isAdmin && hasNoOpenRevision && displayRevision?.state === "REJECTED";
  const canRestore =
    isAdmin && hasNoOpenRevision && article.publicationStatus !== "LIVE" && displayRevision?.state === "ARCHIVED";

  const [form, setForm] = useState<FormState>(() => toFormState(displayRevision, article));
  const [version, setVersion] = useState<number>(displayRevision?.version ?? 0);
  const [media, setMedia] = useState<MediaAssetView[]>(initialMedia);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [startingCorrection, setStartingCorrection] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [unpublishReason, setUnpublishReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // DM-02 excludes autosave as a binding decision — the only defense
  // against silent data loss is warning before an unsaved tab closes.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty) e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await clientFetch(`/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          headline: form.headline,
          summary: form.summary,
          body: form.body,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
          ...(form.featuredImage.featuredImageId ? { featuredImageId: form.featuredImage.featuredImageId } : {}),
          featuredImageAlt: form.featuredImage.featuredImageAlt ?? "",
          featuredImageCredit: form.featuredImage.featuredImageCredit ?? "",
          featuredImageCaption: form.featuredImage.featuredImageCaption ?? "",
          categoryId: form.categoryId,
          bylineOverride: form.bylineOverride,
        }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const updated = (await res.json()) as { version: number };
      setVersion(updated.version);
      setDirty(false);
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await clientFetch(`/articles/${article.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.push("/staff/articles");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    setError(null);
    setWithdrawing(true);
    try {
      const res = await clientFetch(`/articles/${article.id}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.refresh();
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleStartCorrection() {
    setError(null);
    setStartingCorrection(true);
    try {
      const res = await clientFetch(`/articles/${article.id}/correct`, { method: "POST" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.refresh();
    } finally {
      setStartingCorrection(false);
    }
  }

  /// T14 — admin only, reopens a REJECTED story as a fresh editable DRAFT
  /// (docs/10 A-04 "Only an admin can reopen a rejected story").
  async function handleReopen() {
    setError(null);
    setReopening(true);
    try {
      const res = await clientFetch(`/articles/${article.id}/reopen`, { method: "POST" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.refresh();
    } finally {
      setReopening(false);
    }
  }

  /// T15 — admin only, retires a REJECTED story permanently (docs/10 A-09).
  async function handleArchive() {
    setError(null);
    setArchiving(true);
    try {
      const res = await clientFetch(`/articles/${article.id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.refresh();
    } finally {
      setArchiving(false);
    }
  }

  /// T16 — admin only, restores an ARCHIVED story as a fresh editable DRAFT.
  async function handleRestore() {
    setError(null);
    setRestoring(true);
    try {
      const res = await clientFetch(`/articles/${article.id}/restore`, { method: "POST" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      router.refresh();
    } finally {
      setRestoring(false);
    }
  }

  /// T12 — admin only, takes a LIVE story down (docs/10 A-08 — "must be
  /// fast to reach... a legal demand or a serious factual error does not
  /// wait"). A reason is required (UnpublishDto).
  async function handleUnpublish() {
    setError(null);
    setUnpublishing(true);
    try {
      const res = await clientFetch(`/articles/${article.id}/unpublish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, reason: unpublishReason }),
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      setUnpublishReason("");
      router.refresh();
    } finally {
      setUnpublishing(false);
    }
  }

  function handleMediaUploaded(asset: MediaAssetView) {
    setMedia((m) => [asset, ...m]);
  }

  return (
    <div className="space-y-space-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-2 text-ink">{form.headline || "Untitled"}</h1>
          <p className="mt-space-1 text-body-sm text-ink-muted">/{article.slug}</p>
        </div>
        {displayRevision ? <StatusBadge state={displayRevision.state} size="md" /> : null}
      </div>

      {error ? <Alert variant="danger" title={error} /> : null}
      {saved && !dirty ? <Alert variant="success" title="Saved" /> : null}
      {dirty ? <Alert variant="attention" title="Unsaved changes" /> : null}

      <FeedbackPanel history={history} />

      {isInReview ? (
        <Alert variant="info" title="Waiting for review">
          This story is being reviewed and can&rsquo;t be edited right now.
        </Alert>
      ) : null}

      {isAdmin && !isInReview && article.openRevision ? (
        <Alert variant="info" title="Read-only">
          Editors write stories; you review them. Submitted stories appear in the review queue.
        </Alert>
      ) : null}

      {canStartCorrection ? (
        <Alert variant="info" title="This story is published">
          <div className="mt-space-2 flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
            <Button variant="secondary" size="sm" loading={startingCorrection} onClick={handleStartCorrection}>
              Start a correction
            </Button>
          </div>
        </Alert>
      ) : null}

      {canWithdraw ? (
        <Alert variant="danger" title="Withdraw this story">
          <p className="mb-space-2">
            Removes it from the site, listings, feed and sitemap immediately. A reason is required.
          </p>
          <TextAreaField
            label="Reason"
            rows={2}
            value={unpublishReason}
            onChange={(e) => setUnpublishReason(e.target.value)}
          />
          <div className="mt-space-2">
            <ConfirmAction
              label="Withdraw"
              confirmLabel="Take this story down?"
              variant="destructive"
              loading={unpublishing}
              disabled={unpublishReason.trim().length === 0}
              onConfirm={handleUnpublish}
            />
          </div>
        </Alert>
      ) : null}

      {canReopenOrArchive ? (
        <Alert variant="attention" title="This story was rejected">
          <div className="mt-space-2 flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
            <Button variant="secondary" size="sm" loading={reopening} onClick={handleReopen}>
              Reopen as a new draft
            </Button>
            <Button variant="tertiary" size="sm" loading={archiving} onClick={handleArchive}>
              Archive permanently
            </Button>
          </div>
        </Alert>
      ) : null}

      {canRestore ? (
        <Alert variant="info" title="This story is archived">
          <Button variant="secondary" size="sm" loading={restoring} onClick={handleRestore} className="mt-space-2">
            Restore as a new draft
          </Button>
        </Alert>
      ) : null}

      <form onSubmit={handleSave} className="space-y-space-5">
        <TextField label="Headline" required disabled={!isEditable} value={form.headline} onChange={(e) => update("headline", e.target.value)} />
        <TextAreaField
          label="Summary"
          rows={3}
          required
          disabled={!isEditable}
          value={form.summary}
          onChange={(e) => update("summary", e.target.value)}
        />

        <div>
          <span className="text-label text-ink-muted">Section</span>
          <select
            className="mt-1 h-10 w-full rounded-sm border border-rule-strong bg-paper px-space-3 text-body text-ink disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-muted"
            disabled={!isEditable}
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <TextField
          label="Byline override"
          optional
          disabled={!isEditable}
          value={form.bylineOverride}
          onChange={(e) => update("bylineOverride", e.target.value)}
        />

        <div>
          <span className="text-label text-ink-muted">Featured image</span>
          <div className="mt-1">
            <FeaturedImagePicker
              value={form.featuredImage}
              onChange={(v) => update("featuredImage", v)}
              media={media}
              onMediaUploaded={handleMediaUploaded}
              disabled={!isEditable}
            />
          </div>
        </div>

        <div>
          <span className="text-label text-ink-muted">Body</span>
          <div className="mt-1">
            <BodyEditor
              blocks={form.body}
              onChange={(b) => update("body", b)}
              media={media}
              onMediaUploaded={handleMediaUploaded}
              disabled={!isEditable}
            />
          </div>
        </div>

        <TextField label="SEO title" optional disabled={!isEditable} value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} />
        <TextAreaField
          label="SEO description"
          optional
          rows={2}
          disabled={!isEditable}
          value={form.seoDescription}
          onChange={(e) => update("seoDescription", e.target.value)}
        />

        <div>
          <span className="text-label text-ink-muted">Sources</span>
          <div className="mt-1">
            <SourcePicker
              articleId={article.id}
              attached={attachedSources}
              available={sources}
              disabled={!isEditable}
              version={version}
              onVersionChange={setVersion}
            />
          </div>
        </div>

        {isEditable ? (
          <div className="flex items-center gap-x-space-3 border-t border-rule pt-space-4">
            <Button type="submit" variant="secondary" loading={saving}>
              Save
            </Button>
            <Button type="button" variant="primary" loading={submitting} disabled={dirty} onClick={handleSubmit}>
              Submit for review
            </Button>
            {dirty ? <span className="text-body-sm text-ink-muted">Save before submitting</span> : null}
            <div className="ml-auto flex items-center gap-x-space-4">
              {isAdmin ? (
                <Link href={`/staff/articles/${article.id}/history`} className="text-body-sm text-accent underline">
                  History
                </Link>
              ) : null}
              <Link href={`/staff/articles/${article.id}/preview`} className="text-body-sm text-accent underline">
                Preview
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-x-space-4 border-t border-rule pt-space-4">
            <Link href={`/staff/articles/${article.id}/preview`} className="text-body-sm text-accent underline">
              Preview
            </Link>
            {isAdmin ? (
              <Link href={`/staff/articles/${article.id}/history`} className="text-body-sm text-accent underline">
                History
              </Link>
            ) : null}
          </div>
        )}

        {isInReview && !isAdmin ? (
          <div className="border-t border-rule pt-space-4">
            <Button type="button" variant="destructive" loading={withdrawing} onClick={handleWithdraw}>
              Withdraw from review
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
