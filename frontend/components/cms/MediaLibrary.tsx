"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { MediaAssetView, MediaReconcileResult } from "@/lib/api/cms-types";
import { clientFetch, readErrorMessage } from "@/lib/api/client-fetch";
import { uploadMediaFile } from "@/lib/api/upload-media";
import { formatRelative } from "@/lib/format-date";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { ConfirmAction } from "./ConfirmAction";
import { useToast } from "./Toast";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/// The media library — every image the newsroom has uploaded, with what
/// it costs (dimensions, stored size) and the two housekeeping actions the
/// picker inside the editor can't offer: delete (for good — Cloudinary and
/// the database together, refused while a live or in-progress story shows
/// the image) and, for admins, a sync against Cloudinary for images that
/// were deleted from its dashboard and would otherwise linger here and
/// render as broken pictures.
export function MediaLibrary({ media: initialMedia, viewer }: { media: MediaAssetView[]; viewer: AuthenticatedUser }) {
  const [media, setMedia] = useState(initialMedia);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<MediaReconcileResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, info, error: toastError } = useToast();
  const isAdmin = viewer.role === "ADMIN";

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file);
      setMedia((list) => [asset, ...list]);
      success("Image uploaded", `${asset.originalFilename ?? "Image"} — stored at ${formatBytes(asset.sizeBytes)}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toastError("Upload failed", message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
    info("Image deleted", `${asset.originalFilename ?? asset.storageKey} has been removed from Cloudinary and the library.`);
  }

  return (
    <div className="space-y-space-5">
      {error ? <Alert variant="danger" title={error} /> : null}

      <div className="flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
        <p className="mr-auto text-body-sm text-ink-muted">
          {media.length} image{media.length === 1 ? "" : "s"} · images are re-encoded and bounded to 2,400 px on upload
        </p>
        {isAdmin ? (
          <Button type="button" variant="secondary" size="sm" loading={syncing} onClick={handleSync}>
            Sync with Cloudinary
          </Button>
        ) : (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload image
            </Button>
          </>
        )}
      </div>

      {lastSync && lastSync.affectedStories.length > 0 ? (
        <Alert variant="attention" title="Stories that were showing a deleted image">
          <p className="mb-space-1">
            Their featured-image pointer has been cleared. If the image was used inside the body, open the story and
            remove that block — the page would otherwise show a broken picture.
          </p>
          <ul className="list-disc pl-space-4">
            {lastSync.affectedStories.map((s) => (
              <li key={`${s.articleId}:${s.state}`}>
                <a href={`/staff/articles/${s.articleId}/edit`} className="text-accent underline">
                  /{s.slug}
                </a>{" "}
                <span className="text-ink-muted">({s.state.toLowerCase().replace("_", " ")})</span>
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {media.length === 0 ? (
        <div className="rounded-md border border-rule px-space-4 py-space-8 text-center">
          <p className="text-heading-4 text-ink">No images yet</p>
          <p className="mt-space-2 text-body text-ink-secondary">
            {isAdmin ? "Editors upload images from the story editor or from here." : "Upload one here or from any story."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-space-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              canDelete={isAdmin || asset.uploadedByUserId === viewer.id}
              mine={asset.uploadedByUserId === viewer.id}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MediaCard({
  asset,
  canDelete,
  mine,
  onDeleted,
}: {
  asset: MediaAssetView;
  canDelete: boolean;
  mine: boolean;
  onDeleted: (asset: MediaAssetView) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <li className="flex flex-col overflow-hidden rounded-md border border-rule bg-paper">
      <div className="relative aspect-4/3 w-full bg-surface-sunken">
        <Image
          src={asset.url}
          alt={asset.originalFilename ?? ""}
          fill
          sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-y-space-1 px-space-3 py-space-2">
        <p className="truncate text-body-sm text-ink" title={asset.originalFilename ?? asset.storageKey}>
          {asset.originalFilename ?? asset.storageKey}
        </p>
        <p className="text-meta text-ink-muted">
          {asset.width && asset.height ? `${asset.width} × ${asset.height} · ` : ""}
          {formatBytes(asset.sizeBytes)}
        </p>
        <p className="text-meta text-ink-faint">
          {mine ? "Uploaded by you" : "Uploaded"} {formatRelative(asset.createdAt)}
        </p>
        {error ? <p className="text-meta text-danger">{error}</p> : null}
        {canDelete ? (
          <div className="mt-auto pt-space-2">
            <ConfirmAction
              label="Delete"
              confirmLabel="Remove it from Cloudinary too?"
              variant="destructive"
              loading={busy}
              onConfirm={handleDelete}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}
