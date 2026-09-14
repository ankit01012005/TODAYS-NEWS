"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { MediaAssetView } from "@/lib/api/cms-types";
import { uploadMediaFile } from "@/lib/api/upload-media";
import { Button } from "./Button";
import { FIELD_CLASS, TextField } from "./TextField";
import { useToast } from "./Toast";

export interface FeaturedImageValue {
  featuredImageId: string | null;
  featuredImageAlt: string | null;
  featuredImageCredit: string | null;
  featuredImageCaption: string | null;
}

/// 1j's "LEAD IMAGE" card: a 16:9 preview, choose from the library or
/// upload, then alt (required — the field goes red until it's there),
/// credit and caption. Alt, credit and caption live on the revision, not
/// the asset, because the same photo is captioned differently per story.
export function FeaturedImagePicker({
  value,
  onChange,
  media,
  onMediaUploaded,
  disabled,
}: {
  value: FeaturedImageValue;
  onChange: (value: FeaturedImageValue) => void;
  media: MediaAssetView[];
  onMediaUploaded: (asset: MediaAssetView) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { success, error: toastError } = useToast();
  const selected = media.find((m) => m.id === value.featuredImageId) ?? null;
  const altMissing = Boolean(value.featuredImageId) && !(value.featuredImageAlt ?? "").trim();

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file);
      onMediaUploaded(asset);
      onChange({ ...value, featuredImageId: asset.id });
      success("Image uploaded", `${asset.originalFilename ?? "Image"} is the lead image — add the alt text.`);
    } catch (err) {
      toastError("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-space-2">
      <div className="relative aspect-16/9 w-full overflow-hidden border border-rule bg-surface-deep">
        {selected ? (
          <Image src={selected.url} alt={value.featuredImageAlt ?? ""} fill sizes="300px" className="object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-caption text-ink-faint">1600×900 · none chosen</span>
        )}
        {selected && !disabled ? (
          <button
            type="button"
            aria-label="Remove lead image"
            onClick={() => onChange({ featuredImageId: null, featuredImageAlt: null, featuredImageCredit: null, featuredImageCaption: null })}
            className="absolute right-space-2 top-space-2 grid h-7 w-7 place-items-center bg-ink/80 text-bone transition-colors hover:bg-brand"
          >
            <X size={13} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className="flex gap-x-space-2">
        <select
          aria-label="Choose a lead image from the library"
          className={`h-9 min-w-0 flex-1 ${FIELD_CLASS} border-rule-strong text-body-sm`}
          disabled={disabled}
          value={value.featuredImageId ?? ""}
          onChange={(e) => onChange({ ...value, featuredImageId: e.target.value || null })}
        >
          <option value="">No lead image</option>
          {media.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.originalFilename ?? asset.storageKey}
            </option>
          ))}
        </select>
        {!disabled ? (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
            <Button type="button" variant="secondary" size="sm" className="h-9" icon={<Upload size={13} />} loading={uploading} loadingLabel="…" onClick={() => fileInputRef.current?.click()}>
              Upload
            </Button>
          </>
        ) : null}
      </div>
      {value.featuredImageId ? (
        <>
          <TextField
            id="lead-alt"
            label="Alt text"
            labelNote="required"
            placeholder="What the picture shows"
            error={altMissing ? "Needed before submit — what does the picture show?" : undefined}
            disabled={disabled}
            value={value.featuredImageAlt ?? ""}
            onChange={(e) => onChange({ ...value, featuredImageAlt: e.target.value })}
          />
          <TextField
            id="lead-credit"
            label="Credit"
            optional
            disabled={disabled}
            value={value.featuredImageCredit ?? ""}
            onChange={(e) => onChange({ ...value, featuredImageCredit: e.target.value })}
          />
          <TextField
            id="lead-caption"
            label="Caption"
            optional
            disabled={disabled}
            value={value.featuredImageCaption ?? ""}
            onChange={(e) => onChange({ ...value, featuredImageCaption: e.target.value })}
          />
        </>
      ) : null}
    </div>
  );
}
