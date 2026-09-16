"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, RefreshCw, Search, Upload } from "lucide-react";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { MediaAssetView, MediaReconcileResult } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { uploadMediaFile } from "@/lib/api/upload-media";
import { formatDateTime, formatRelative } from "@/lib/format-date";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { Panel, PageHeader, CmsEmpty } from "./Panel";
import { FIELD_CLASS } from "./TextField";
import { useToast } from "./Toast";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/// 2m — the media library: every image the newsroom has uploaded, a
/// drop zone (editors), a filename search and a "mine" filter, a grid of
/// cards, and a detail panel for the selected image with Copy URL and
/// Delete. Delete is real — Cloudinary and the database together — and
/// the API refuses it while a live or in-progress story still shows the
/// image; the refusal is shown next to the button, with the reason.
/// Admins can Sync with Cloudinary to drop rows whose object was deleted
/// from its dashboard.
export function MediaLibrary({ media: initialMedia, viewer }: { media: MediaAssetView[]; viewer: AuthenticatedUser }) {
  const [media, setMedia] = useState(initialMedia);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<MediaReconcileResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, info, error: toastError } = useToast();
  const isAdmin = viewer.role === "ADMIN";
  const canUpload = !isAdmin;

  const totalBytes = useMemo(() => media.reduce((n, m) => n + m.sizeBytes, 0), [media]);
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return media.filter((m) => {
      if (mineOnly && m.uploadedByUserId !== viewer.id) return false;
      if (needle && !(m.originalFilename ?? m.storageKey).toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [media, search, mineOnly, viewer.id]);
  const selected = media.find((m) => m.id === selectedId) ?? null;

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of list) {
        const asset = await uploadMediaFile(file);
        setMedia((current) => [asset, ...current]);
        setSelectedId(asset.id);
        success("Image uploaded", `${asset.originalFilename ?? "Image"} — stored at ${formatBytes(asset.sizeBytes)}.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toastError("Upload failed", message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) void uploadFiles(e.target.files);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (!canUpload) return;
    void uploadFiles(e.dataTransfer.files);
  }

  async function handleSync() {
    setError(null);
    setSyncing(true);
    try {
      const res = await clientFetch("/media/reconcile", { method: "POST" });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const result = (await res.json()) as MediaReconcileResult;
      setLastSync(result);
      if (result.removed.length === 0) {
        success("Library is in sync", `All ${result.checked} images still exist in Cloudinary.`);
      } else {
        const gone = new Set(result.removed.map((r) => r.id));
        setMedia((list) => list.filter((m) => !gone.has(m.id)));
        if (selectedId && gone.has(selectedId)) setSelectedId(null);
        info(
          `${result.removed.length} missing image${result.removed.length === 1 ? "" : "s"} removed`,
          result.affectedStories.length > 0
            ? `${result.affectedStories.length} stor${result.affectedStories.length === 1 ? "y" : "ies"} referenced them — see below.`
            : "No story was using them.",
        );
      }
    } finally {
      setSyncing(false);
    }
  }

  function handleDeleted(asset: MediaAssetView) {
    setMedia((list) => list.filter((m) => m.id !== asset.id));
    setSelectedId(null);
    info("Image deleted", `${asset.originalFilename ?? asset.storageKey} has been removed from Cloudinary and the library.`);
  }

  return (
    <div className="space-y-space-5">
      <PageHeader
        title="Media"
        lede={`${media.length} image${media.length === 1 ? "" : "s"} · ${formatBytes(totalBytes)} on Cloudinary`}
        actions={
          <>
            {isAdmin ? (
              <Button variant="secondary" icon={<RefreshCw size={14} />} loading={syncing} loadingLabel="Syncing…" onClick={handleSync}>
                Sync with Cloudinary
              </Button>
            ) : null}
            {canUpload ? (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
                <Button variant="primary" icon={<Upload size={14} />} loading={uploading} loadingLabel="Uploading…" onClick={() => fileInputRef.current?.click()}>
                  Upload
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {error ? <Alert variant="danger" title={error} /> : null}

      <div className="flex flex-wrap items-center gap-x-space-2 gap-y-space-2">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search filename</span>
          <Search size={14} className="pointer-events-none absolute left-space-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`h-9 !pl-9 ${FIELD_CLASS} border-rule-strong text-body-sm`}
          />
        </label>
        <button
          type="button"
          aria-pressed={mineOnly}
          onClick={() => setMineOnly((v) => !v)}
          className={`inline-flex h-9 items-center rounded-pill border px-space-3 text-caption transition-colors ${
            mineOnly ? "border-ink bg-ink text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
          }`}
        >
          Mine
        </button>
      </div>

      {canUpload ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed bg-paper px-space-4 py-space-5 text-center text-body-sm transition-colors ${
            dragging ? "border-brand bg-brand-wash text-brand" : "border-rule-strong text-ink-muted"
          }`}
        >
          Drop images here · JPEG, PNG, WebP · bounded to 2,400px on the long edge and re-encoded on upload
        </div>
      ) : null}

      {lastSync && lastSync.affectedStories.length > 0 ? (
        <Alert variant="attention" title="Stories that were showing a deleted image">
          <p className="mb-space-1">
            Their lead-image pointer has been cleared. If the image was used inside the body, open the story and remove
            that block — the page would otherwise show a broken picture.
          </p>
          <ul className="list-[square] pl-space-4">
            {lastSync.affectedStories.map((s) => (
              <li key={`${s.articleId}:${s.state}`}>
                <Link href={`/staff/articles/${s.articleId}/edit`} className="text-ink underline decoration-brand/60 underline-offset-4">
                  /{s.slug}
                </Link>{" "}
                <span className="text-ink-muted">({s.state.toLowerCase().replace(/_/g, " ")})</span>
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {visible.length === 0 ? (
        <CmsEmpty
          title={media.length === 0 ? "No images yet" : "Nothing matches"}
          body={
            media.length === 0
              ? isAdmin
                ? "Editors upload images from the composer or from here."
                : "Upload one here, or from any story."
              : "Try a different filename, or clear the filter."
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-space-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence initial={false}>
            {visible.map((asset) => {
              const isSelected = asset.id === selectedId;
              return (
                <motion.li
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : asset.id)}
                    aria-pressed={isSelected}
                    className={`group block w-full border bg-paper text-left transition-colors ${
                      isSelected ? "border-2 border-brand" : "border-rule-strong hover:border-ink"
                    }`}
                  >
                    <span className="relative block aspect-4/3 w-full overflow-hidden border-b border-rule bg-surface-deep">
                      <Image
                        src={asset.url}
                        alt={asset.originalFilename ?? ""}
                        fill
                        sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
                        className="img-zoom object-cover"
                      />
                    </span>
                    <span className="block px-space-2 py-space-2">
                      <span className="block truncate text-mono-sm text-ink" title={asset.originalFilename ?? asset.storageKey}>
                        {asset.originalFilename ?? asset.storageKey}
                      </span>
                      <span className={`mt-space-1 block text-caption ${isSelected ? "text-brand" : "text-ink-muted"}`}>
                        {isSelected
                          ? "selected"
                          : `${asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}${formatBytes(asset.sizeBytes)}`}
                      </span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-space-4 md:grid-cols-2"
          >
            <SelectedPanel
              asset={selected}
              mine={selected.uploadedByUserId === viewer.id}
              canDelete={isAdmin || selected.uploadedByUserId === viewer.id}
              onDeleted={handleDeleted}
            />
            <Panel tone="danger" heading="Why delete can be refused">
              <p className="text-body-sm text-ink">
                The API blocks it while a live or in-progress revision still shows the image. The refusal names the
                story holding it — open that story and remove the picture first.
              </p>
              <p className="mt-space-2 text-mono-sm text-ink-muted">
                alt text is not stored here — it lives on the revision, because the same photo is captioned differently per story
              </p>
            </Panel>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SelectedPanel({
  asset,
  mine,
  canDelete,
  onDeleted,
}: {
  asset: MediaAssetView;
  mine: boolean;
  canDelete: boolean;
  onDeleted: (asset: MediaAssetView) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success } = useToast();

  async function handleDelete() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch(`/media/${asset.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        setError(await readErrorMessage(res));
        return;
      }
      onDeleted(asset);
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(asset.url);
      success("URL copied");
    } catch {
      setError("Couldn’t reach the clipboard.");
    }
  }

  return (
    <Panel heading={`Selected · ${asset.originalFilename ?? asset.storageKey}`}>
      <p className="text-mono-sm leading-6 text-ink-muted">
        {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
        {formatBytes(asset.sizeBytes)} · {asset.mimeType.replace("image/", "").toUpperCase()}
        <br />
        uploaded {mine ? "by you" : ""} {formatRelative(asset.createdAt)} · {formatDateTime(asset.createdAt)}
      </p>
      {error ? (
        <div className="mt-space-3">
          <Alert variant="danger" title="Delete refused">
            {error}
          </Alert>
        </div>
      ) : null}
      <div className="mt-space-3 flex flex-wrap gap-space-2">
        <Button variant="secondary" size="sm" icon={<Copy size={13} />} onClick={copyUrl}>
          Copy URL
        </Button>
        {canDelete ? (
          <ConfirmAction
            label="Delete"
            confirmLabel="Remove it from Cloudinary too?"
            detail="Gone for good, from the library and from storage."
            variant="destructive"
            size="sm"
            loading={busy}
            onConfirm={handleDelete}
          />
        ) : null}
      </div>
    </Panel>
  );
}
