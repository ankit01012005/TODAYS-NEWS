import { PublicSocialPick, SocialPlatform } from "@/lib/api/public-types";
import { SOCIAL_PLATFORM_LABEL } from "@/lib/social-platform";
import { formatRelative } from "@/lib/format-date";
import { SectionHeading } from "./SectionHeading";

/// "Top on social" — a bento-style rail (brief §6) of posts the newsroom
/// hand-picks each day from Instagram and X. Every card is one outbound
/// link, labelled with its platform and account so readers know before
/// they leave; nothing is embedded or fetched from the platforms
/// (decided 2026-09-12 — no automation, no third-party scripts).
export function SocialPicks({ picks }: { picks: PublicSocialPick[] }) {
  if (picks.length === 0) return null;
  const [lead, ...rest] = picks;
  if (!lead) return null;

  return (
    <section aria-labelledby="social-heading">
      <SectionHeading
        id="social-heading"
        title="Top on social"
        tone="brand"
        eyebrow="Picked by the newsroom"
      />
      <ul className="reveal-stagger mt-space-5 grid grid-cols-1 gap-space-4 sm:grid-cols-2 md:grid-cols-4">
        <li className="reveal sm:col-span-2 md:row-span-2">
          <PickCard pick={lead} large />
        </li>
        {rest.slice(0, 6).map((pick) => (
          <li key={pick.id} className="reveal">
            <PickCard pick={pick} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PickCard({ pick, large = false }: { pick: PublicSocialPick; large?: boolean }) {
  return (
    <a
      href={pick.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`group flex h-full flex-col justify-between border border-rule bg-paper no-underline shadow-depth-1 transition-[box-shadow,transform] duration-(--duration-base) ease-(--ease-out-quart) hover:-translate-y-px hover:shadow-depth-2 ${
        large ? "p-space-6" : "p-space-4"
      }`}
    >
      <div className="flex items-center gap-x-space-2 text-meta text-ink-muted">
        <PlatformGlyph platform={pick.platform} />
        <span>{SOCIAL_PLATFORM_LABEL[pick.platform]}</span>
        <span aria-hidden="true">·</span>
        <span className="truncate text-ink-secondary">{pick.accountHandle}</span>
      </div>
      <p className={`mt-space-3 text-ink ${large ? "text-headline-lg" : "text-headline-sm"}`}>
        <span className="link-underline">{pick.headline}</span>
      </p>
      <p className="mt-space-4 flex items-center justify-between text-meta text-ink-muted">
        <time dateTime={pick.createdAt}>{formatRelative(pick.createdAt)}</time>
        <span className="text-ink-secondary">
          Open on {SOCIAL_PLATFORM_LABEL[pick.platform] === "Elsewhere" ? "site" : SOCIAL_PLATFORM_LABEL[pick.platform]}{" "}
          <span aria-hidden="true">↗</span>
          <span className="sr-only">(opens in a new tab)</span>
        </span>
      </p>
    </a>
  );
}

/// Inline glyphs — no icon font, no third-party assets (brief §28).
function PlatformGlyph({ platform }: { platform: SocialPlatform }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", "aria-hidden": true as const, className: "shrink-0" };
  if (platform === "X") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-7-6.2 7H1.4l8.1-9.3L1 2h7l4.9 6.4L18.9 2Zm-1.2 18h1.9L7.3 3.9H5.3L17.7 20Z" />
      </svg>
    );
  }
  if (platform === "INSTAGRAM") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}
