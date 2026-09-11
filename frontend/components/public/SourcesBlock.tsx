import { PublicSourceRef } from "@/lib/api/public-types";
import { platformLabel } from "@/lib/social-platform";

/// docs/19 §3.9 — beneath the body, above "More in this section". The API
/// already filters to isPublic sources only (public.service.ts). A source
/// with a recorded link (OQ-24, resolved 2026-09-12) is an outbound link
/// labelled with where it goes — X, Instagram, a site — so readers know
/// before they leave; one without stays plain text.
export function SourcesBlock({ sources }: { sources: PublicSourceRef[] }) {
  if (sources.length === 0) return null;

  return (
    <section aria-labelledby="sources-heading" className="mt-space-8 border-t-2 border-ink pt-space-4">
      <h2 id="sources-heading" className="text-label text-ink-muted">
        Sources
      </h2>
      <ol className="mt-space-3 divide-y divide-rule">
        {sources.map((source, index) => {
          const platform = source.url ? platformLabel(source.url) : null;
          return (
            <li key={`${source.name}-${index}`} className="flex gap-x-space-4 py-space-3 text-body-sm text-ink-secondary">
              <span className="w-6 shrink-0 text-meta tabular-nums text-ink-muted">{index + 1}</span>
              <span className="min-w-0">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="link-underline text-ink"
                  >
                    {source.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="text-ink">{source.name}</span>
                )}
                {platform ? (
                  <span className="ml-space-2 rounded-pill border border-rule px-space-2 py-px text-label text-ink-muted">
                    {platform}
                  </span>
                ) : null}
                {source.note ? <span className="text-ink-muted"> — {source.note}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
