"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

/// A modal on the native <dialog> element — focus trapping, Escape and
/// the backdrop come from the browser, so there is nothing to get wrong.
/// The one depth-2 shadow in the CMS lives here. `dismissible={false}`
/// keeps it open until the caller closes it (the session-expired case,
/// where closing would lose the draft).
export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
  dismissible = true,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  dismissible?: boolean;
  width?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const widthClass = width === "sm" ? "max-w-sm" : width === "lg" ? "max-w-2xl" : "max-w-md";

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        if (!dismissible) e.preventDefault();
        else onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === ref.current) onClose();
      }}
      className={`dialog-shell m-auto w-[calc(100%-32px)] ${widthClass} border border-ink bg-paper p-0 text-ink shadow-depth-3 backdrop:bg-ink/55`}
    >
      <div className="p-space-5">
        <div className="flex items-start justify-between gap-x-space-4">
          <div>
            {eyebrow ? <p className="text-label text-brand">{eyebrow}</p> : null}
            <h2 id="dialog-title" className="mt-space-1 text-heading-2 text-ink">
              {title}
            </h2>
          </div>
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-space-2 -mt-space-2 grid h-8 w-8 place-items-center text-ink-muted transition-colors hover:text-ink"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className="mt-space-4">{children}</div>
      </div>
    </dialog>
  );
}
