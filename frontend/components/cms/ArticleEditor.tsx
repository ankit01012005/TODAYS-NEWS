"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Circle, Copy, Eye, History, Send } from "lucide-react";
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
import { clientFetch, readWriteFailure, WriteFailure } from "@/lib/api/client-fetch";
import { BodyBlock, parseBody, textOf } from "@/lib/api/body-blocks";
import { formatRelative } from "@/lib/format-date";
import { Alert } from "./Alert";
import { BodyEditor } from "./BodyEditor";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { FeaturedImagePicker, FeaturedImageValue } from "./FeaturedImagePicker";
import { FeedbackPanel } from "./FeedbackPanel";
import { Panel } from "./Panel";
import { SourcePicker } from "./SourcePicker";
import { LiveBadge, StatusBadge } from "./StatusBadge";
import { FIELD_CLASS, SelectField, TextAreaField, TextField } from "./TextField";
import { useToast } from "./Toast";
import { SessionExpiredDialog, StaleVersionNotice } from "./WriteFailures";

/// The only two states a revision may still be written in. Mirrors the
/// backend's EDITABLE_STATES; the backend is the real enforcement point,
/// this only decides what the UI offers.
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

function bodyHasContent(blocks: BodyBlock[]): boolean {
  return blocks.some((b) => {
    if (b.type === "paragraph" || b.type === "heading" || b.type === "quote") return textOf(b.content).trim().length > 0;
    if (b.type === "list") return b.items.some((i) => textOf(i).trim().length > 0);
    if (b.type === "image") return b.url.length > 0;
    return false;
  });
}

function bodyAltMissing(blocks: BodyBlock[]): boolean {
  return blocks.some((b) => b.type === "image" && b.url.length > 0 && b.alt.trim().length === 0);
}

/// Plain text of everything typed — what "Copy my text first" puts on
/// the clipboard when a save is refused as stale.
function plainText(form: FormState): string {
  const body = form.body
    .map((b) => {
      if (b.type === "paragraph" || b.type === "heading" || b.type === "quote") return textOf(b.content);
      if (b.type === "list") return b.items.map((i) => `• ${textOf(i)}`).join("\n");
      if (b.type === "image") return `[image: ${b.alt}]`;
      return "---";
    })
    .join("\n\n");
  return `${form.headline}\n\n${form.summary}\n\n${body}`.trim();
}

/// 1j — the composer, and 1m — the live story's controls. One page
/// covers editable, waiting-for-review and read-only: the same component
/// with different affordances, matching the editable-states rule already
/// enforced server-side. Every transition posts the version the page
/// loaded; a stale one surfaces as "someone else changed this", a lost
/// session as a sign-in dialog that keeps the draft on screen.
export function ArticleEditor({
  article,
  categories,
  media: initialMedia,
  sources,
  attachedSources,
  history,
  viewerRole,
  names,
}: {
  article: ArticleDetailView;
  categories: CategoryView[];
  media: MediaAssetView[];
  sources: SourceView[];
  attachedSources: ArticleSourceView[];
  history: RevisionHistoryEntryView[];
  viewerRole: "EDITOR" | "ADMIN";
  names?: Record<string, string>;
}) {
  const router = useRouter();
  const latestHistoryRevision = history.at(-1) ?? null;
  const displayRevision: RevisionView | null = article.openRevision ?? article.publishedRevision ?? latestHistoryRevision;
  const isAdmin = viewerRole === "ADMIN";
  const isLive = article.publicationStatus === "LIVE";
  // Admin has no authoring capability at all — these must exclude admin
  // explicitly rather than relying on article state alone.
  const isEditable = !isAdmin && article.openRevision !== null && EDITABLE_STATES.includes(article.openRevision.state);
  const isInReview = article.openRevision?.state === "IN_REVIEW";
  const hasNoOpenRevision = article.openRevision === null;
  const canStartCorrection = !isAdmin && isLive && hasNoOpenRevision;
  const canWithdraw = isAdmin && isLive && hasNoOpenRevision;
  const canReopenOrArchive = isAdmin && hasNoOpenRevision && displayRevision?.state === "REJECTED";
  const canRestore = isAdmin && hasNoOpenRevision && !isLive && displayRevision?.state === "ARCHIVED";
  const canDelete = isAdmin && !isLive;

  const [form, setForm] = useState<FormState>(() => toFormState(displayRevision, article));
  const [version, setVersion] = useState<number>(displayRevision?.version ?? 0);
  const [media, setMedia] = useState<MediaAssetView[]>(initialMedia);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<number | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [unpublishReason, setUnpublishReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const retryRef = useRef<(() => Promise<void>) | null>(null);
  const { success, info } = useToast();

  const category = categories.find((c) => c.id === form.categoryId) ?? null;
  const publicPath = `/${(categories.find((c) => c.id === article.categoryId) ?? category)?.slug ?? ""}/${article.slug}`;

  // No autosave by design — the only defence against silent data loss is
  // warning before an unsaved tab closes.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty) e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  /// Every write goes through here so the three failure kinds are
  /// handled identically: stale → the red panel; signed out → the
  /// sign-in dialog that retries this exact action; anything else →
  /// an inline alert.
  async function perform(label: string, request: () => Promise<Response>, onOk: (res: Response) => Promise<void> | void): Promise<void> {
    setError(null);
    setStale(false);
    setBusy(label);
    try {
      const res = await request();
      if (!res.ok) {
        const failure: WriteFailure = await readWriteFailure(res);
        if (failure.kind === "stale") setStale(true);
        else if (failure.kind === "signed-out") {
          retryRef.current = () => perform(label, request, onOk);
          setSessionExpired(true);
        } else setError(failure.message);
        return;
      }
      await onOk(res);
    } finally {
      setBusy(null);
    }
  }

  function handleSourceFailure(failure: WriteFailure) {
    if (failure.kind === "stale") setStale(true);
    else if (failure.kind === "signed-out") setSessionExpired(true);
    else setError(failure.message);
  }

  async function save() {
    setSaving(true);
    try {
      await perform(
        "save",
        () =>
          clientFetch(`/articles/${article.id}`, {
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
          }),
        async (res) => {
          const updated = (await res.json()) as { version: number };
          setVersion(updated.version);
          setDirty(false);
          setSavedAt(new Date().toISOString());
          setJustSaved(true);
          window.clearTimeout(savedTimer.current);
          savedTimer.current = window.setTimeout(() => setJustSaved(false), 2200);
          success("Saved.", "Nothing is live until the desk approves it.");
          router.refresh();
        },
      );
    } finally {
      setSaving(false);
    }
  }

  // Ctrl/Cmd+S saves, the way every writing tool does. The listener is
  // re-bound each render so it always sees the latest form — cheap.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isEditable && !saving) void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    await save();
  }

  function transition(label: string, path: string, body: Record<string, unknown> | null, onOk: (res: Response) => Promise<void> | void) {
    return perform(
      label,
      () =>
        clientFetch(`/articles/${article.id}/${path}`, {
          method: "POST",
          ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
        }),
      onOk,
    );
  }

  const handleSubmit = () =>
    transition("submit", "submit", { version }, () => {
      success("Sent to the desk.", "An editor will approve it, send it back with notes, or decline it.");
      router.push("/staff/articles");
      router.refresh();
    });
  const handleWithdraw = () =>
    transition("withdraw", "withdraw", { version }, () => {
      info("Pulled back from review.", "It’s a draft again — edit and resubmit when it’s ready.");
      router.refresh();
    });
  const handleStartCorrection = () =>
    transition("correct", "correct", null, () => {
      success("Correction started.", "Readers keep seeing the live version until the desk publishes your changes.");
      router.refresh();
    });
  const handleReopen = () =>
    transition("reopen", "reopen", null, () => {
      success("Reopened as a new draft.");
      router.refresh();
    });
  const handleArchive = () =>
    transition("archive", "archive", { version }, () => {
      info("Archived.", "It stays on record under Archived and can be restored or deleted from there.");
      router.refresh();
    });
  const handleRestore = () =>
    transition("restore", "restore", null, () => {
      success("Restored as a new draft.");
      router.refresh();
    });
  const handleUnpublish = () =>
    transition("unpublish", "unpublish", { version, reason: unpublishReason }, () => {
      setUnpublishReason("");
      info("Withdrawn from the site.", "It is off the site, the feed and the sitemap; the public cache was purged.");
      router.refresh();
    });
  const handleDelete = () =>
    perform(
      "delete",
      () => clientFetch(`/articles/${article.id}`, { method: "DELETE" }),
      async (res) => {
        const deleted = (await res.json()) as { slug: string; headline: string | null };
        info("Deleted permanently.", `“${deleted.headline ?? deleted.slug}” is gone from the database. The audit record stays.`);
        router.push("/staff/articles");
        router.refresh();
      },
    );

  async function copyCaption() {
    const url = `${window.location.origin}${publicPath}`;
    const caption = `${form.headline}\n\n${form.summary}\n\n${url}`;
    try {
      await navigator.clipboard.writeText(caption);
      success("Caption copied.", "Headline, summary and the story’s link — ready to paste on a handle.");
    } catch {
      setError("Couldn’t reach the clipboard. Select the headline and summary and copy them by hand.");
    }
  }

  function handleMediaUploaded(asset: MediaAssetView) {
    setMedia((m) => [asset, ...m]);
  }

  // 1j "BEFORE YOU SUBMIT" — mirrors BR-09 and the alt-text CHECK
  // constraint, so submit never 400s.
  const checks = [
    { key: "headline", label: "Headline", ok: form.headline.trim().length > 0 },
    { key: "summary", label: "Summary", ok: form.summary.trim().length > 0 },
    { key: "body", label: "Body has content", ok: bodyHasContent(form.body) },
    { key: "section", label: "Section chosen", ok: Boolean(form.categoryId) },
    {
      key: "alt",
      label: form.featuredImage.featuredImageId ? "Alt text on the lead image" : "Lead image (optional)",
      ok: !form.featuredImage.featuredImageId || Boolean(form.featuredImage.featuredImageAlt?.trim()),
      optional: !form.featuredImage.featuredImageId,
    },
    ...(form.body.some((b) => b.type === "image" && b.url)
      ? [{ key: "body-alt", label: "Alt text on every picture", ok: !bodyAltMissing(form.body) }]
      : []),
  ];
  const ready = checks.every((c) => c.ok);
  const canSubmit = isEditable && ready && !dirty && !saving;
  const backHref = isAdmin ? "/staff/articles" : "/staff/articles";

  return (
    <div className="-mt-space-5 md:-mt-space-6">
      {/* Toolbar — dark, sticky beneath the header. */}
      <div className="band-dark sticky top-14 z-30 -mx-space-4 flex min-h-12 flex-wrap items-center justify-between gap-x-space-4 gap-y-space-2 px-space-4 py-space-2 md:-mx-space-6 md:px-space-6">
        <div className="flex min-w-0 items-center gap-x-space-3">
          <Link href={backHref} className="inline-flex items-center gap-x-space-1 text-body-sm text-bone/65 no-underline hover:text-bone">
            <ChevronLeft size={14} aria-hidden="true" />
            {isAdmin ? "All articles" : "My articles"}
          </Link>
          {isLive ? <LiveBadge /> : null}
          {displayRevision && (!isLive || article.openRevision) ? <StatusBadge state={displayRevision.state} onDark /> : null}
        </div>
        <div className="flex items-center gap-x-space-2">
          <SaveState savedAt={savedAt} dirty={dirty} version={version} editable={isEditable} />
          <Link
            href={`/staff/articles/${article.id}/preview`}
            className="inline-flex h-8 items-center gap-x-space-1 border border-bone/50 px-space-3 text-body-sm text-bone no-underline transition-colors hover:border-bone hover:bg-bone/10"
          >
            <Eye size={13} aria-hidden="true" />
            Preview
          </Link>
          {isEditable ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={saving}
                loadingLabel="Saving…"
                icon={justSaved ? <Check size={13} className="tick-pop text-success" /> : undefined}
                onClick={() => void save()}
              >
                {justSaved ? "Saved" : "Save"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Send size={13} />}
                loading={busy === "submit"}
                loadingLabel="Sending…"
                disabled={!canSubmit}
                title={!ready ? "Finish the checklist first" : dirty ? "Save before submitting" : undefined}
                onClick={handleSubmit}
              >
                Submit for review
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-space-5 space-y-space-3">
        {stale ? <StaleVersionNotice loadedVersion={version} textToCopy={() => plainText(form)} /> : null}
        {error ? <Alert variant="danger" title={error} /> : null}
      </div>

      <div className="mt-space-4 grid grid-cols-1 gap-x-space-6 gap-y-space-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ---- Left: the story ---- */}
        <form id="article-form" onSubmit={handleSave} className="min-w-0 space-y-space-5">
          <FeedbackPanel history={history} names={names} />

          {isInReview ? (
            <Alert variant="info" title="With the desk">
              This story is being reviewed and can’t be edited right now.
              {!isAdmin ? " Pull it back if you need to change something." : ""}
            </Alert>
          ) : null}
          {isAdmin && !isInReview && article.openRevision ? (
            <Alert variant="info" title="Read-only">
              Editors write stories; you review them. It reaches the review queue when it’s submitted.
            </Alert>
          ) : null}
          {canReopenOrArchive ? (
            <Alert variant="attention" title="The desk declined this story">
              <div className="mt-space-2 flex flex-wrap gap-space-2">
                <Button variant="secondary" size="sm" loading={busy === "reopen"} onClick={handleReopen}>
                  Reopen as a new draft
                </Button>
                <Button variant="tertiary" size="sm" loading={busy === "archive"} onClick={handleArchive}>
                  Archive
                </Button>
              </div>
            </Alert>
          ) : null}
          {canRestore ? (
            <Alert variant="info" title="This story is archived">
              <Button variant="secondary" size="sm" loading={busy === "restore"} onClick={handleRestore} className="mt-space-2">
                Restore as a new draft
              </Button>
            </Alert>
          ) : null}

          <div>
            <label htmlFor="headline" className="text-label text-ink-muted">
              Headline
            </label>
            <input
              id="headline"
              required
              disabled={!isEditable}
              placeholder="The headline goes here, plainly"
              value={form.headline}
              onChange={(e) => update("headline", e.target.value)}
              className={`mt-space-1 h-12 ${FIELD_CLASS} border-rule-strong text-heading-3 font-bold`}
            />
          </div>

          <TextAreaField
            id="summary"
            label="Summary"
            labelNote="one or two sentences"
            rows={3}
            required
            disabled={!isEditable}
            placeholder="What happened, for someone who will only read this line."
            value={form.summary}
            onChange={(e) => update("summary", e.target.value)}
          />

          <BodyEditor
            blocks={form.body}
            onChange={(b) => update("body", b)}
            media={media}
            onMediaUploaded={handleMediaUploaded}
            disabled={!isEditable}
          />

          {isInReview && !isAdmin ? (
            <div className="border-t border-rule pt-space-4">
              <ConfirmAction
                label="Pull back from review"
                confirmLabel="Take it back from the desk?"
                detail="It becomes a draft again. Nothing readers see changes."
                variant="secondary"
                loading={busy === "withdraw"}
                onConfirm={handleWithdraw}
              />
            </div>
          ) : null}
        </form>

        {/* ---- Right rail ---- */}
        <aside className="space-y-space-4 lg:sticky lg:top-[104px] lg:self-start">
          {isEditable ? (
            <Panel heading="Before you submit">
              <ul className="space-y-space-2">
                {checks.map((check) => (
                  <li key={check.key} className={`flex items-center gap-x-space-2 text-body-sm ${check.ok ? (check.optional ? "text-ink-muted" : "text-success") : "text-brand"}`}>
                    {check.ok ? (
                      <Check size={14} strokeWidth={2.5} aria-hidden="true" className="tick-pop" />
                    ) : (
                      <Circle size={14} aria-hidden="true" />
                    )}
                    <span>{check.label}</span>
                    <span className="sr-only">{check.ok ? " — done" : " — still needed"}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-space-3 text-mono-sm text-ink-faint">
                {ready ? (dirty ? "save, then submit" : "ready to submit") : "submit unlocks when every line is ticked"}
              </p>
            </Panel>
          ) : null}

          {isLive ? (
            <Panel tone="ink" heading="Live story" headingAside={<LiveBadge />}>
              <p className="text-caption text-ink-muted">
                published {article.publishedAt ? formatRelative(article.publishedAt) : "—"}
              </p>
              <p className="mt-space-1 break-all text-mono-sm text-ink-muted">
                {publicPath} · slug is fixed forever now
              </p>
              <div className="mt-space-3 flex flex-col gap-y-space-2">
                <Link
                  href={publicPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center border border-ink bg-paper px-space-3 text-body-sm text-ink no-underline transition-colors hover:bg-ink hover:text-paper"
                >
                  View on the site
                </Link>
                <Button variant="secondary" size="sm" className="h-9" icon={<Copy size={13} />} onClick={copyCaption}>
                  Copy caption for social
                </Button>
                {canStartCorrection ? (
                  <Button variant="secondary" size="sm" className="h-9" loading={busy === "correct"} onClick={handleStartCorrection}>
                    Start a correction
                  </Button>
                ) : null}
                <Link
                  href={`/staff/articles/${article.id}/history`}
                  className="inline-flex h-9 items-center justify-center gap-x-space-1 border border-rule-strong bg-paper px-space-3 text-body-sm text-ink-secondary no-underline transition-colors hover:border-ink hover:text-ink"
                >
                  <History size={13} aria-hidden="true" />
                  View history ({history.length} revision{history.length === 1 ? "" : "s"})
                </Link>
              </div>
              {canWithdraw ? (
                <div className="mt-space-4 border-t border-rule pt-space-3">
                  <TextAreaField
                    id="unpublish-reason"
                    label="Withdraw from the site"
                    labelNote="reason required"
                    rows={2}
                    placeholder="Why it’s coming down — recorded in the audit log."
                    value={unpublishReason}
                    onChange={(e) => setUnpublishReason(e.target.value)}
                  />
                  <div className="mt-space-2">
                    <ConfirmAction
                      label="Withdraw from the site"
                      confirmLabel="Take this story down now?"
                      detail="It leaves the site, the feed and the sitemap immediately, and the public cache is purged."
                      variant="gold"
                      size="sm"
                      loading={busy === "unpublish"}
                      disabled={unpublishReason.trim().length === 0}
                      onConfirm={handleUnpublish}
                    />
                  </div>
                </div>
              ) : null}
              <p className="mt-space-3 text-mono-sm text-ink-faint">
                a correction opens a new revision — readers keep the published one until it’s approved
              </p>
            </Panel>
          ) : null}

          <Panel heading="Lead image">
            <FeaturedImagePicker
              value={form.featuredImage}
              onChange={(v) => update("featuredImage", v)}
              media={media}
              onMediaUploaded={handleMediaUploaded}
              disabled={!isEditable}
            />
            <p className="mt-space-2 text-mono-sm text-ink-faint">alt / credit / caption live on the revision, not the asset</p>
          </Panel>

          <Panel heading="Section & byline">
            <SelectField id="categoryId" label="Section" disabled={!isEditable} value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            <div className="mt-space-3">
              <TextField
                id="bylineOverride"
                label="Byline override"
                optional
                placeholder="leave empty to use your name"
                disabled={!isEditable}
                value={form.bylineOverride}
                onChange={(e) => update("bylineOverride", e.target.value)}
              />
            </div>
            <p className="mt-space-2 text-mono-sm text-ink-faint">saved on the revision — readers only see it after publish</p>
          </Panel>

          <Panel heading="Sources">
            <SourcePicker
              articleId={article.id}
              attached={attachedSources}
              available={sources}
              disabled={!isEditable}
              version={version}
              onVersionChange={setVersion}
              onFailure={handleSourceFailure}
            />
          </Panel>

          <details className="group border border-rule-strong bg-paper">
            <summary className="flex cursor-pointer list-none items-center justify-between p-space-4 text-label text-ink [&::-webkit-details-marker]:hidden">
              Search & sharing
              <span className="text-mono-sm text-ink-faint group-open:hidden">optional</span>
            </summary>
            <div className="space-y-space-3 px-space-4 pb-space-4">
              <TextField id="seoTitle" label="SEO title" optional disabled={!isEditable} value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} />
              <TextAreaField
                id="seoDescription"
                label="SEO description"
                optional
                rows={2}
                disabled={!isEditable}
                value={form.seoDescription}
                onChange={(e) => update("seoDescription", e.target.value)}
              />
            </div>
          </details>

          {canDelete ? (
            <Panel tone="danger" heading="Delete permanently">
              <p className="text-body-sm text-ink">
                {isLive ? "Refused while live." : "Removes the story and every one of its revisions, citations and review decisions."} The audit record stays.
              </p>
              <div className="mt-space-3">
                <ConfirmAction
                  label="Delete permanently"
                  confirmLabel="Delete this story permanently?"
                  detail={`${history.length} revision${history.length === 1 ? "" : "s"}, their citations and review decisions go with it.`}
                  variant="destructive"
                  size="sm"
                  typeToConfirm={form.headline.trim() || article.slug}
                  yesLabel="Delete"
                  loading={busy === "delete"}
                  onConfirm={handleDelete}
                />
              </div>
            </Panel>
          ) : null}
        </aside>
      </div>

      <SessionExpiredDialog
        open={sessionExpired}
        onSignedIn={() => {
          setSessionExpired(false);
          const retry = retryRef.current;
          retryRef.current = null;
          if (retry) void retry();
        }}
      />
    </div>
  );
}

/// "saved 12s ago · v7" — re-renders every ten seconds so the age stays
/// honest; "unsaved changes" the moment something is typed.
function SaveState({ savedAt, dirty, version, editable }: { savedAt: string | null; dirty: boolean; version: number; editable: boolean }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 10_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="hidden text-mono-sm text-bone/55 sm:inline" aria-live="polite">
      {editable && dirty ? <span className="text-gold">unsaved changes</span> : savedAt ? `saved ${formatRelative(savedAt)}` : "no changes"} · v{version}
    </span>
  );
}
