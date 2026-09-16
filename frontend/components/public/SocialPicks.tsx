import { ExternalLink } from "lucide-react";
import { PublicSocialPick } from "@/lib/api/public-types";
import { SOCIAL_PLATFORM_LABEL } from "@/lib/social-platform";
import { formatRelative } from "@/lib/format-date";
import { SocialGlyph, glyphForPlatform } from "@/components/brand/SocialGlyph";

/// "TOP ON SOCIAL" — the gold-bordered panel in 1a's right rail: posts
/// the newsroom hand-picks from Instagram and X. Every row is one
/// outbound link labelled with its platform and account so readers know
/// before they leave; nothing is embedded or fetched from the platforms.
/// Gold is a curation surface, so the ink on it is gold-deep, never gold.
export function SocialPicks({ picks, className = "" }: { picks: PublicSocialPick[]; className?: string }) {
  if (picks.length === 0) return null;

  return (
    <section
      aria-labelledby="social-heading"
      className={`border border-gold bg-gold-wash p-space-4 ${className}`}
    >
      <h2 id="social-heading" className="text-label-lg text-gold-deep">
        Top on social
      </h2>
      <ul className="mt-space-3 flex flex-col gap-y-space-3">
        {picks.slice(0, 5).map((pick) => (
          <li key={pick.id}>
            <a
              href={pick.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group flex items-start gap-x-space-3 no-underline"
            >
              <span className="mt-[2px] grid h-6 w-6 shrink-0 place-items-center border border-gold-deep/50 text-gold-deep">
                <SocialGlyph platform={glyphForPlatform(pick.platform)} size={12} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-caption text-gold-deep">
                  {SOCIAL_PLATFORM_LABEL[pick.platform]} · {pick.accountHandle}
                </span>
                <span className="mt-space-1 block text-headline-sm text-ink">
                  <span className="link-underline">{pick.headline}</span>
                </span>
                <span className="mt-space-1 flex items-center gap-x-space-1 text-caption text-ink-muted">
                  <time dateTime={pick.createdAt}>{formatRelative(pick.createdAt)}</time>
                  <ExternalLink size={11} aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
