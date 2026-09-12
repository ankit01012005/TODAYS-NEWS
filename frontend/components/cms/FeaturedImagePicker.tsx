"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { MediaAssetView } from "@/lib/api/cms-types";
import { uploadMediaFile } from "@/lib/api/upload-media";
import { Button } from "./Button";
import { TextField } from "./TextField";

export interface FeaturedImageValue {
  featuredImageId: string | null;
  featuredImageAlt: string | null;
  featuredImageCredit: string | null;
  featuredImageCaption: string | null;
}

/// docs/19 §2.2 — an image only "counts" as attached once it has alt
/// text; that's enforced by the caller at submit time (same generous-
/// mid-draft, strict-at-submit balance BR-09 already uses for headline/
/// summary/body), so this component only nudges via the hint text below.
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
  const selected = media.find((m) => m.id === value.featuredImageId) ?? null;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file);
      onMediaUploaded(asset);
      onChange({ ...value, featuredImageId: asset.id });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-space-2">
      {selected ? (
        <div className="relative h-48 w-full overflow-hidden rounded-sm bg-surface-sunken">
          <Image src={selected.url} alt={value.featuredImageAlt ?? ""} fill className="object-cover" />
        </div>
      ) : null}
      <div className="flex items-center gap-x-space-3">
        <select
          className="h-10 flex-1 rounded-sm border border-rule-strong px-space-3 text-body text-ink"
          disabled={disabled}
          value={value.featuredImageId ?? ""}
          onChange={(e) => onChange({ ...value, featuredImageId: e.target.value || null })}
        >
          <option value="">No featured image</option>
          {media.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.originalFilename ?? asset.storageKey}
            </option>
          ))}
        </select>
        {!disabled ? (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
            <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
              Upload new
            </Button>
          </>
        ) : null}
      </div>
      {value.featuredImageId ? (
        <>
          <TextField
            label="Alt text"
            hint="Required before this image counts as attached"
            disabled={disabled}
            value={value.featuredImageAlt ?? ""}
            onChange={(e) => onChange({ ...value, featuredImageAlt: e.target.value })}
          />
          <TextField
            label="Credit"
            optional
            disabled={disabled}
            value={value.featuredImageCredit ?? ""}
            onChange={(e) => onChange({ ...value, featuredImageCredit: e.target.value })}
          />
          <TextField
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
