import { ExternalLink, ShieldCheck } from "lucide-react";
import { PublicSourceRef } from "@/lib/api/public-types";
import { platformLabel } from "@/lib/social-platform";

/// 1d "SOURCES" — a sunken panel beneath the body listing the citations
/// the newsroom chose to show (the API already filters to isPublic).
/// A verified source carries the green badge; one with a recorded link
/// is an outbound link labelled with where it goes.
export function SourcesBlock({ sources }: { sources: PublicSourceRef[] }) {
  if (sources.length === 0) return null;

  return (
    <section aria-labelledby="sources-heading" className="reveal mt-space-8 border border-rule bg-surface-sunken p-space-4 md:p-space-5">
      <h2 id="sources-heading" className="text-label-lg text-ink">
        Sources
      </h2>
      <ol className="mt-space-3 flex flex-col gap-y-space-3">
        {sources.map((source, index) => {
          const platform = source.url ? platformLabel(source.url) : null;
          return (
            <li key={`${source.name}-${index}`} className="flex flex-wrap items-center gap-x-space-2 gap-y-space-1 text-body-sm text-ink-secondary">
              {source.verified ? (
                <span className="inline-flex h-6 items-center gap-x-space-1 rounded-pill border border-success px-space-2 text-label text-success">
                  <ShieldCheck size={11} aria-hidden="true" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex h-6 items-center rounded-pill border border-rule-strong px-space-2 text-label text-ink-muted">
                  Source
                </span>
              )}
              <span className="min-w-0">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="link-underline inline-flex items-center gap-x-space-1 text-ink"
                  >
                    {source.name}
                    <ExternalLink size={11} aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="text-ink">{source.name}</span>
                )}
                {platform ? <span className="ml-space-2 text-mono-sm text-ink-muted">{platform}</span> : null}
                {source.note ? <span className="text-ink-muted"> — {source.note}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
