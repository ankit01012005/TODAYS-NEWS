import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SocialGlyph } from "@/components/brand/SocialGlyph";
import { PulseLine } from "@/components/brand/PulseLine";
import { SOCIAL_HANDLES } from "@/lib/site";

/// 1b's "Our handles" distribution bar, carried into the front page: a
/// dark band naming where the newsroom publishes. Static — lib/site.ts,
/// no API. Also the footer of the article page's mobile share bar.
export function HandlesBar({ compact = false }: { compact?: boolean }) {
  return (
    <div className="band-dark">
      <div
        className={`mx-auto flex max-w-(--width-page-max) flex-wrap items-center gap-x-space-5 gap-y-space-3 px-space-4 md:px-space-6 ${
          compact ? "py-space-3" : "py-space-4"
        }`}
      >
        <div className="flex items-center gap-x-space-3">
          <span className="text-label text-gold">Our handles</span>
          {!compact ? <PulseLine width={56} color="var(--color-brand)" className="hidden sm:block" /> : null}
        </div>
        <ul className="flex flex-wrap gap-space-2">
          {SOCIAL_HANDLES.map((handle) => (
            <li key={handle.key}>
              <a
                href={handle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-x-space-2 rounded-pill border border-bone/35 px-space-3 text-body-sm text-bone no-underline transition-[color,border-color,transform] duration-(--duration-fast) hover:-translate-y-px hover:border-gold hover:text-gold"
              >
                <SocialGlyph platform={handle.key} size={13} />
                {handle.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        {!compact ? (
          <Link
            href="/pr"
            className="link-underline ml-auto hidden items-center gap-x-space-1 text-body-sm text-bone/70 hover:text-bone md:inline-flex"
          >
            Where our stories land <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
