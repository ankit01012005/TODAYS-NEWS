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
    categoryId: article.categoryId,
    bylineOverride: article.bylineOverride ?? "",
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
}: {
  article: ArticleDetailView;
  categories: CategoryView[];
  media: MediaAssetView[];
  sources: SourceView[];
  attachedSources: ArticleSourceView[];
  history: RevisionHistoryEntryView[];
}) {
  const router = useRouter();
  const latestHistoryRevision = history.at(-1) ?? null;
  const displayRevision: RevisionView | null = article.openRevision ?? article.publishedRevision ?? latestHistoryRevision;
  const isEditable = article.openRevision !== null && EDITABLE_STATES.includes(article.openRevision.state);
  const isInReview = article.openRevision?.state === "IN_REVIEW";
  const canStartCorrection = article.publicationStatus === "LIVE" && article.openRevision === null;

  const [form, setForm] = useState<FormState>(() => toFormState(displayRevision, article));
  const [version, setVersion] = useState<number>(displayRevision?.version ?? 0);
  const [media, setMedia] = useState<MediaAssetView[]>(initialMedia);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [startingCorrection, setStartingCorrection] = useState(false);
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

      {canStartCorrection ? (
        <Alert variant="info" title="This story is published">
          <Button variant="secondary" size="sm" loading={startingCorrection} onClick={handleStartCorrection} className="mt-space-2">
            Start a correction
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
            className="mt-1 h-10 w-full rounded-sm border border-rule-strong px-space-3 text-body text-ink"
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
            <SourcePicker articleId={article.id} attached={attachedSources} available={sources} disabled={!isEditable} />
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
            <Link href={`/staff/articles/${article.id}/preview`} className="ml-auto text-body-sm text-accent underline">
              Preview
            </Link>
          </div>
        ) : (
          <div className="border-t border-rule pt-space-4">
            <Link href={`/staff/articles/${article.id}/preview`} className="text-body-sm text-accent underline">
              Preview
            </Link>
          </div>
        )}

        {isInReview ? (
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
