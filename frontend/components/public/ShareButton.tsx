"use client";

import { useEffect, useRef, useState } from "react";

/// Brief §18 — sharing with clear feedback. Uses the Web Share API where
/// the platform has one (mobile, mostly), otherwise copies the address to
/// the clipboard. No third-party share widgets: nothing is loaded from
/// anyone else's servers, and the page never knows who shared it.
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function share() {
    const url = `${window.location.origin}${path}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch (error) {
      // AbortError = the user dismissed the share sheet; that isn't a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-9 items-center gap-x-space-2 rounded-pill border border-rule-strong bg-paper px-space-4 text-meta text-ink transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface active:translate-y-px"
      aria-live="polite"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v13" />
      </svg>
      {state === "copied" ? "Link copied" : state === "failed" ? "Couldn’t share" : "Share"}
    </button>
  );
}
