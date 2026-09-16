"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { SocialGlyph } from "@/components/brand/SocialGlyph";

type ShareState = "idle" | "copied" | "failed";

/// `url` is the story's absolute address, built on the server from
/// SITE_URL, so the share sheet and the WhatsApp link carry the public
/// origin rather than whatever host the page happens to be served from.
function useShare(title: string, url: string) {
  const [state, setState] = useState<ShareState>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function settle(next: ShareState) {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  }

  async function share() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      settle("copied");
    } catch (error) {
      // AbortError = the user dismissed the share sheet; that isn't a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      settle("failed");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      settle("copied");
    } catch {
      settle("failed");
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;

  return { state, share, copy, whatsappHref };
}

/// The pill in the article's byline rule. Uses the Web Share API where
/// the platform has one (mobile, mostly), otherwise copies the address.
/// No third-party widgets: nothing is loaded from anyone else's servers,
/// and the page never knows who shared it.
export function ShareButton({ title, url }: { title: string; url: string }) {
  const { state, share } = useShare(title, url);

  return (
    <button
      type="button"
      onClick={share}
      aria-live="polite"
      className="inline-flex h-8 items-center gap-x-space-2 rounded-pill border border-rule-strong bg-paper px-space-3 text-label text-ink transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-ink active:translate-y-px"
    >
      {state === "copied" ? <Check size={13} aria-hidden="true" /> : <Share2 size={13} aria-hidden="true" />}
      {state === "copied" ? "Link copied" : state === "failed" ? "Couldn’t share" : "Share"}
    </button>
  );
}

/// 1g — the sticky bar at the foot of the story on a phone: WhatsApp and
/// Copy link, side by side. Hidden at md+ where the byline pill does the
/// job. WhatsApp is a plain wa.me link, so it works with no script and
/// opens the app when one is installed.
export function MobileShareBar({ title, url }: { title: string; url: string }) {
  const { state, copy, whatsappHref } = useShare(title, url);

  return (
    <div className="sticky bottom-0 z-(--z-nav) mt-space-6 border-t border-rule bg-surface/95 px-space-4 py-space-3 backdrop-blur-md md:hidden">
      <div className="flex gap-x-space-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 flex-1 items-center justify-center gap-x-space-2 border border-ink bg-paper text-body-sm font-medium text-ink no-underline"
        >
          <SocialGlyph platform="whatsapp" size={15} />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={copy}
          aria-live="polite"
          className="inline-flex h-10 flex-1 items-center justify-center gap-x-space-2 border border-ink bg-paper text-body-sm font-medium text-ink"
        >
          {state === "copied" ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
          {state === "copied" ? "Copied" : state === "failed" ? "Couldn’t copy" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
