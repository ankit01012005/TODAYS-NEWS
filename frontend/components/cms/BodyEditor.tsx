"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { BLOCK_TYPE_LABELS, BodyBlock, emptyBlock, ImageBlock, spansOf, textOf } from "@/lib/api/body-blocks";
import { MediaAssetView } from "@/lib/api/cms-types";
import { uploadMediaFile } from "@/lib/api/upload-media";
import { Button } from "./Button";
import { TextAreaField, TextField } from "./TextField";

interface BodyEditorProps {
  blocks: BodyBlock[];
  onChange: (blocks: BodyBlock[]) => void;
  media: MediaAssetView[];
  onMediaUploaded: (asset: MediaAssetView) => void;
  disabled?: boolean;
}

/// docs/26 §3.2's six V1 block types, edited directly rather than through
/// a rich-text surface — DM-08 (no dangerouslySetInnerHTML) holds on the
/// write side too: every block is a typed form, never raw HTML.
export function BodyEditor({ blocks, onChange, media, onMediaUploaded, disabled }: BodyEditorProps) {
  function updateBlock(index: number, next: BodyBlock) {
    const copy = blocks.slice();
    copy[index] = next;
    onChange(copy);
  }
  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }
  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const copy = blocks.slice();
    const moved = copy[index];
    const displaced = copy[target];
    if (!moved || !displaced) return;
    copy[index] = displaced;
    copy[target] = moved;
    onChange(copy);
  }
  function addBlock(type: BodyBlock["type"]) {
    onChange([...blocks, emptyBlock(type)]);
  }

  return (
    <div className="space-y-space-4">
      {blocks.length === 0 ? <p className="text-body-sm text-ink-muted">No content yet.</p> : null}
      {blocks.map((block, index) => (
        <div key={index} className="rounded-md border border-rule p-space-3">
          <div className="mb-space-2 flex items-center justify-between">
            <span className="text-label text-ink-muted">{BLOCK_TYPE_LABELS[block.type]}</span>
            {!disabled ? (
              <div className="flex gap-x-space-3">
                <button
                  type="button"
                  onClick={() => moveBlock(index, -1)}
                  disabled={index === 0}
                  className="text-body-sm text-ink-muted disabled:text-ink-faint"
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, 1)}
                  disabled={index === blocks.length - 1}
                  className="text-body-sm text-ink-muted disabled:text-ink-faint"
                >
                  Move down
                </button>
                <button type="button" onClick={() => removeBlock(index)} className="text-body-sm text-danger">
                  Remove
                </button>
              </div>
            ) : null}
          </div>
          <BlockEditor
            block={block}
            onChange={(next) => updateBlock(index, next)}
            media={media}
            onMediaUploaded={onMediaUploaded}
            disabled={disabled}
          />
        </div>
      ))}
      {!disabled ? (
        <div className="flex flex-wrap gap-x-space-2 gap-y-space-2">
          {(Object.keys(BLOCK_TYPE_LABELS) as BodyBlock["type"][]).map((type) => (
            <Button key={type} type="button" variant="secondary" size="sm" onClick={() => addBlock(type)}>
              + {BLOCK_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
  media,
  onMediaUploaded,
  disabled,
}: {
  block: BodyBlock;
  onChange: (b: BodyBlock) => void;
  media: MediaAssetView[];
  onMediaUploaded: (asset: MediaAssetView) => void;
  disabled?: boolean;
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <TextAreaField
          label="Text"
          rows={4}
          disabled={disabled}
          value={textOf(block.content)}
          onChange={(e) => onChange({ ...block, content: spansOf(e.target.value) })}
        />
      );
    case "heading":
      return (
        <div className="space-y-space-2">
          <div className="flex gap-x-space-3">
            {([2, 3] as const).map((level) => (
              <label key={level} className="flex items-center gap-x-1 text-body-sm text-ink-secondary">
                <input
                  type="radio"
                  name="heading-level"
                  disabled={disabled}
                  checked={block.level === level}
                  onChange={() => onChange({ ...block, level })}
                />
                Heading {level}
              </label>
            ))}
          </div>
          <TextField
            label="Text"
            disabled={disabled}
            value={textOf(block.content)}
            onChange={(e) => onChange({ ...block, content: spansOf(e.target.value) })}
          />
        </div>
      );
    case "image":
      return (
        <ImageBlockEditor block={block} onChange={onChange} media={media} onMediaUploaded={onMediaUploaded} disabled={disabled} />
      );
    case "quote":
      return (
        <div className="space-y-space-2">
          <TextAreaField
            label="Quote"
            rows={3}
            disabled={disabled}
            value={textOf(block.content)}
            onChange={(e) => onChange({ ...block, content: spansOf(e.target.value) })}
          />
          <TextField
            label="Attribution"
            optional
            disabled={disabled}
            value={block.attribution ?? ""}
            onChange={(e) => onChange({ ...block, attribution: e.target.value || undefined })}
          />
        </div>
      );
    case "list":
      return (
        <div className="space-y-space-2">
          <label className="flex items-center gap-x-2 text-body-sm text-ink-secondary">
            <input
              type="checkbox"
              disabled={disabled}
              checked={block.style === "ordered"}
              onChange={(e) => onChange({ ...block, style: e.target.checked ? "ordered" : "unordered" })}
            />
            Numbered list
          </label>
          <TextAreaField
            label="Items (one per line)"
            rows={4}
            disabled={disabled}
            value={block.items.map(textOf).join("\n")}
            onChange={(e) => onChange({ ...block, items: e.target.value.split("\n").map(spansOf) })}
          />
        </div>
      );
    case "divider":
      return <p className="text-body-sm text-ink-faint">A horizontal rule between sections.</p>;
  }
}

function ImageBlockEditor({
  block,
  onChange,
  media,
  onMediaUploaded,
  disabled,
}: {
  block: ImageBlock;
  onChange: (b: BodyBlock) => void;
  media: MediaAssetView[];
  onMediaUploaded: (asset: MediaAssetView) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file);
      onMediaUploaded(asset);
      onChange({ ...block, mediaId: asset.id, url: asset.url });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-space-2">
      {block.url ? (
        <div className="relative h-40 w-full overflow-hidden rounded-sm bg-surface-sunken">
          <Image src={block.url} alt={block.alt} fill className="object-cover" />
        </div>
      ) : null}
      <div className="flex items-center gap-x-space-3">
        <select
          className="h-10 flex-1 rounded-sm border border-rule-strong px-space-3 text-body text-ink"
          disabled={disabled}
          value={block.mediaId}
          onChange={(e) => {
            const asset = media.find((m) => m.id === e.target.value);
            onChange({ ...block, mediaId: e.target.value, url: asset ? asset.url : "" });
          }}
        >
          <option value="">Choose uploaded image…</option>
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
      <TextField
        label="Alt text"
        hint="Required for accessibility"
        disabled={disabled}
        value={block.alt}
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
      />
      <TextField
        label="Credit"
        optional
        disabled={disabled}
        value={block.credit ?? ""}
        onChange={(e) => onChange({ ...block, credit: e.target.value || undefined })}
      />
      <TextField
        label="Caption"
        optional
        disabled={disabled}
        value={block.caption ?? ""}
        onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
      />
    </div>
  );
}
