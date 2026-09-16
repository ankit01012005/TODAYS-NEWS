"use client";

import { ChangeEvent, ReactNode, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Heading2, ImageIcon, List, Minus, Pilcrow, Plus, Quote, Trash2, Upload } from "lucide-react";
import { BLOCK_TYPE_LABELS, BodyBlock, emptyBlock, ImageBlock, spansOf, textOf } from "@/lib/api/body-blocks";
import { MediaAssetView } from "@/lib/api/cms-types";
import { uploadMediaFile } from "@/lib/api/upload-media";
import { Button } from "./Button";
import { FIELD_CLASS, TextField } from "./TextField";
import { useToast } from "./Toast";

interface BodyEditorProps {
  blocks: BodyBlock[];
  onChange: (blocks: BodyBlock[]) => void;
  media: MediaAssetView[];
  onMediaUploaded: (asset: MediaAssetView) => void;
  disabled?: boolean;
}

const BLOCK_ICON: Record<BodyBlock["type"], ReactNode> = {
  paragraph: <Pilcrow size={13} />,
  heading: <Heading2 size={13} />,
  image: <ImageIcon size={13} />,
  quote: <Quote size={13} />,
  list: <List size={13} />,
  divider: <Minus size={13} />,
};

const BLOCK_SHORT: Record<BodyBlock["type"], string> = {
  paragraph: "para",
  heading: "head",
  image: "img",
  quote: "quote",
  list: "list",
  divider: "rule",
};

const BLOCK_ORDER: BodyBlock["type"][] = ["paragraph", "heading", "image", "quote", "list", "divider"];

/// 1j — the body as a list of the six block types, each row with a type
/// gutter on the left and its controls on the right. Every block is a
/// typed form, never raw HTML (the write side of DM-08). Blocks are
/// validated server-side, max 500.
export function BodyEditor({ blocks, onChange, media, onMediaUploaded, disabled }: BodyEditorProps) {
  // Blocks carry no id of their own, so the editor keeps a parallel list
  // of keys for React and the enter/exit animation — kept in step with
  // every add, move and remove, and re-synced during render if the list
  // is replaced from outside (the "adjust state on prop change" pattern).
  const [ids, setIds] = useState<string[]>(() => blocks.map(() => uid()));
  if (ids.length !== blocks.length) {
    setIds(blocks.map((_, i) => ids[i] ?? uid()));
  }

  function updateBlock(index: number, next: BodyBlock) {
    const copy = blocks.slice();
    copy[index] = next;
    onChange(copy);
  }
  function removeBlock(index: number) {
    setIds(ids.filter((_, i) => i !== index));
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
    const nextIds = ids.slice();
    [nextIds[index], nextIds[target]] = [nextIds[target] ?? uid(), nextIds[index] ?? uid()];
    setIds(nextIds);
    onChange(copy);
  }
  function addBlock(type: BodyBlock["type"], at?: number) {
    const next = emptyBlock(type);
    const position = at === undefined || at >= blocks.length ? blocks.length : at;
    setIds([...ids.slice(0, position), uid(), ...ids.slice(position)]);
    onChange([...blocks.slice(0, position), next, ...blocks.slice(position)]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-space-3 gap-y-space-2">
        <span className="text-label text-ink-muted">Body</span>
        {!disabled ? <BlockTypePills onAdd={(type) => addBlock(type)} /> : null}
      </div>

      <div className="mt-space-2 border border-rule-strong bg-paper">
        {blocks.length === 0 ? (
          <div className="px-space-4 py-space-6 text-center">
            <p className="text-body-sm text-ink-muted">No content yet. Add a paragraph to start writing.</p>
            {!disabled ? (
              <Button variant="secondary" size="sm" icon={<Plus size={13} />} className="mt-space-3" onClick={() => addBlock("paragraph")}>
                Add a paragraph
              </Button>
            ) : null}
          </div>
        ) : null}
        <AnimatePresence initial={false}>
          {blocks.map((block, index) => (
            <motion.div
              key={ids[index] ?? index}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="group flex gap-x-space-3 border-b border-rule px-space-3 py-space-3 last:border-b-0"
            >
              <span className="flex w-[56px] shrink-0 items-start gap-x-space-1 pt-[9px] text-caption text-ink-muted" aria-hidden="true">
                {BLOCK_ICON[block.type]}
                {BLOCK_SHORT[block.type]}
              </span>
              <div className="min-w-0 flex-1">
                <span className="sr-only">{BLOCK_TYPE_LABELS[block.type]} block</span>
                <BlockEditor
                  block={block}
                  onChange={(next) => updateBlock(index, next)}
                  media={media}
                  onMediaUploaded={onMediaUploaded}
                  disabled={disabled}
                />
              </div>
              {!disabled ? (
                <div className="flex shrink-0 flex-col gap-y-space-1 opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <IconButton label="Move up" disabled={index === 0} onClick={() => moveBlock(index, -1)}>
                    <ArrowUp size={13} />
                  </IconButton>
                  <IconButton label="Move down" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)}>
                    <ArrowDown size={13} />
                  </IconButton>
                  <IconButton label="Remove block" tone="danger" onClick={() => removeBlock(index)}>
                    <Trash2 size={13} />
                  </IconButton>
                </div>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!disabled ? (
        <div className="mt-space-2 flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
          <AddBlockMenu onAdd={(type) => addBlock(type)} />
          <span className="text-mono-sm text-ink-faint">blocks are validated server-side · max 500 · no raw HTML ever</span>
        </div>
      ) : null}
    </div>
  );
}

let counter = 0;
function uid(): string {
  counter += 1;
  return `b${counter}-${Date.now().toString(36)}`;
}

function BlockTypePills({ onAdd }: { onAdd: (type: BodyBlock["type"]) => void }) {
  return (
    <div className="flex flex-wrap gap-x-space-1 gap-y-space-1">
      {BLOCK_ORDER.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          className="inline-flex h-6 items-center gap-x-space-1 rounded-pill border border-rule-strong px-space-2 text-caption text-ink transition-colors hover:border-ink"
          aria-label={`Add ${BLOCK_TYPE_LABELS[type].toLowerCase()}`}
        >
          <span aria-hidden="true">{BLOCK_ICON[type]}</span>
          {BLOCK_TYPE_LABELS[type].toLowerCase()}
        </button>
      ))}
    </div>
  );
}

function AddBlockMenu({ onAdd }: { onAdd: (type: BodyBlock["type"]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Add a block
      </Button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 top-full z-20 mt-space-1 w-44 border border-ink bg-paper py-space-1 shadow-depth-2"
          >
            {BLOCK_ORDER.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAdd(type);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-x-space-2 px-space-3 py-space-2 text-left text-body-sm text-ink hover:bg-surface-sunken"
              >
                <span className="text-ink-muted" aria-hidden="true">
                  {BLOCK_ICON[type]}
                </span>
                {BLOCK_TYPE_LABELS[type]}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  tone = "ink",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "ink" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center border border-transparent transition-colors disabled:opacity-30 ${
        tone === "danger" ? "text-ink-muted hover:border-danger hover:text-danger" : "text-ink-muted hover:border-rule-strong hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/// A textarea that grows with its content, so a paragraph never scrolls
/// inside a box.
function GrowingTextArea({
  value,
  onChange,
  placeholder,
  disabled,
  label,
  minRows = 2,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label: string;
  minRows?: number;
  className?: string;
}) {
  return (
    <div className="grid">
      <textarea
        aria-label={label}
        value={value}
        rows={minRows}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`col-start-1 row-start-1 resize-none overflow-hidden py-space-2 ${FIELD_CLASS} border-rule-strong ${className}`}
      />
      {/* An invisible twin with the same styles sets the height. */}
      <div aria-hidden="true" className={`invisible col-start-1 row-start-1 whitespace-pre-wrap py-space-2 ${FIELD_CLASS} border-transparent ${className}`}>
        {value || placeholder}
        {"\n"}
      </div>
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
        <GrowingTextArea
          label="Paragraph"
          placeholder="Write plainly. One idea per paragraph."
          disabled={disabled}
          value={textOf(block.content)}
          onChange={(v) => onChange({ ...block, content: spansOf(v) })}
        />
      );
    case "heading":
      return (
        <div className="flex flex-col gap-y-space-2 sm:flex-row sm:items-start sm:gap-x-space-2">
          <div className="flex shrink-0 gap-x-space-1" role="radiogroup" aria-label="Heading level">
            {([2, 3] as const).map((level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={block.level === level}
                disabled={disabled}
                onClick={() => onChange({ ...block, level })}
                className={`h-10 border px-space-2 text-caption ${
                  block.level === level ? "border-ink bg-ink text-paper" : "border-rule-strong bg-paper text-ink-muted hover:border-ink"
                }`}
              >
                H{level}
              </button>
            ))}
          </div>
          <input
            aria-label="Heading text"
            disabled={disabled}
            placeholder="A short heading"
            value={textOf(block.content)}
            onChange={(e) => onChange({ ...block, content: spansOf(e.target.value) })}
            className={`h-10 ${FIELD_CLASS} border-rule-strong font-semibold`}
          />
        </div>
      );
    case "image":
      return (
        <ImageBlockEditor block={block} onChange={onChange} media={media} onMediaUploaded={onMediaUploaded} disabled={disabled} />
      );
    case "quote":
      return (
        <div className="space-y-space-2 border-l-[3px] border-brand pl-space-3">
          <GrowingTextArea
            label="Quote"
            placeholder="The words, exactly as said."
            disabled={disabled}
            value={textOf(block.content)}
            onChange={(v) => onChange({ ...block, content: spansOf(v) })}
          />
          <input
            aria-label="Attribution"
            disabled={disabled}
            placeholder="— who said it (optional)"
            value={block.attribution ?? ""}
            onChange={(e) => onChange({ ...block, attribution: e.target.value || undefined })}
            className={`h-9 ${FIELD_CLASS} border-rule-strong text-body-sm`}
          />
        </div>
      );
    case "list":
      return (
        <div className="space-y-space-2">
          <GrowingTextArea
            label="List items, one per line"
            placeholder={"One item per line"}
            disabled={disabled}
            value={block.items.map(textOf).join("\n")}
            onChange={(v) => onChange({ ...block, items: v.split("\n").map(spansOf) })}
          />
          <label className="inline-flex items-center gap-x-space-2 text-caption text-ink-secondary">
            <input
              type="checkbox"
              disabled={disabled}
              checked={block.style === "ordered"}
              onChange={(e) => onChange({ ...block, style: e.target.checked ? "ordered" : "unordered" })}
              className="accent-[#C81E1E]"
            />
            Numbered list
          </label>
        </div>
      );
    case "divider":
      return (
        <div className="flex h-10 items-center gap-x-space-3 text-caption text-ink-faint" aria-hidden="true">
          <span className="h-px flex-1 bg-rule" />
          <span className="h-[6px] w-[6px] bg-brand" />
          <span className="h-px flex-1 bg-rule" />
          <span>a rule between sections</span>
        </div>
      );
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
  const { success, error: toastError } = useToast();

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file);
      onMediaUploaded(asset);
      onChange({ ...block, mediaId: asset.id, url: asset.url });
      success("Image uploaded", `${asset.originalFilename ?? "Image"} is in this block — add the alt text.`);
    } catch (err) {
      toastError("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-space-2">
      <div className="flex gap-x-space-3">
        <div className="relative h-20 w-32 shrink-0 overflow-hidden border border-rule bg-surface-deep">
          {block.url ? (
            <Image src={block.url} alt={block.alt} fill sizes="128px" className="object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-caption text-ink-faint">choose from media library</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-y-space-2">
          <select
            aria-label="Choose an uploaded image"
            className={`h-9 ${FIELD_CLASS} border-rule-strong text-body-sm`}
            disabled={disabled}
            value={block.mediaId}
            onChange={(e) => {
              const asset = media.find((m) => m.id === e.target.value);
              onChange({ ...block, mediaId: e.target.value, url: asset ? asset.url : "" });
            }}
          >
            <option value="">Choose from the media library…</option>
            {media.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.originalFilename ?? asset.storageKey}
              </option>
            ))}
          </select>
          {!disabled ? (
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
              <Button type="button" variant="secondary" size="sm" icon={<Upload size={13} />} loading={uploading} loadingLabel="Uploading…" onClick={() => fileInputRef.current?.click()}>
                Upload new
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <TextField
        id={`alt-${block.mediaId || "new"}`}
        label="Alt text"
        hint="Required — what the picture shows, for readers who can't see it."
        error={block.url && !block.alt.trim() ? "Add alt text before submitting." : undefined}
        disabled={disabled}
        value={block.alt}
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
      />
      <div className="grid grid-cols-1 gap-space-2 sm:grid-cols-2">
        <TextField
          id={`credit-${block.mediaId || "new"}`}
          label="Credit"
          optional
          disabled={disabled}
          value={block.credit ?? ""}
          onChange={(e) => onChange({ ...block, credit: e.target.value || undefined })}
        />
        <TextField
          id={`caption-${block.mediaId || "new"}`}
          label="Caption"
          optional
          disabled={disabled}
          value={block.caption ?? ""}
          onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
