"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Monitor, Smartphone } from "lucide-react";

/// 2k — the red band ("PREVIEW · NOT PUBLISHED") with Desktop / Mobile
/// pills and "Back to editing", over the story rendered exactly as the
/// public page renders it. Mobile narrows the frame to a phone width so
/// the writer can see how the headline breaks; nothing else changes.
export function PreviewShell({
  label,
  backHref,
  children,
}: {
  label: string;
  backHref: string;
  children: ReactNode;
}) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="min-h-screen bg-surface-deep">
      <div className="sticky top-0 z-(--z-nav) flex flex-wrap items-center justify-between gap-x-space-4 gap-y-space-2 bg-brand px-space-4 py-space-2 text-paper md:px-space-6">
        <span className="text-label">{label}</span>
        <div className="flex items-center gap-x-space-3">
          <div role="group" aria-label="Preview width" className="flex gap-x-space-1">
            {(
              [
                { key: "desktop", label: "Desktop", icon: <Monitor size={12} aria-hidden="true" /> },
                { key: "mobile", label: "Mobile", icon: <Smartphone size={12} aria-hidden="true" /> },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={mode === option.key}
                onClick={() => setMode(option.key)}
                className={`inline-flex h-7 items-center gap-x-space-1 rounded-pill border px-space-3 text-label transition-colors ${
                  mode === option.key ? "border-paper bg-paper text-brand" : "border-paper/60 text-paper hover:border-paper"
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
          <Link href={backHref} className="inline-flex items-center gap-x-space-1 text-body-sm text-paper no-underline hover:underline">
            <ChevronLeft size={14} aria-hidden="true" />
            Back to editing
          </Link>
        </div>
      </div>

      <div className={`mx-auto transition-[max-width] duration-(--duration-base) ${mode === "mobile" ? "max-w-[390px] px-space-2 py-space-4" : "max-w-none"}`}>
        <div className={mode === "mobile" ? "overflow-hidden border-[6px] border-ink bg-surface" : ""}>{children}</div>
      </div>
    </div>
  );
}
