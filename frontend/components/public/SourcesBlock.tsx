import { PublicSourceRef } from "@/lib/api/public-types";

/// docs/19 §3.9 — beneath the body, above "More in this section". The API
/// already filters to isPublic sources only (public.service.ts). Sources
/// in V1 don't carry an external link (OQ-24 didn't resolve that shape),
/// so this shows the name and any note, without implying a clickable
/// external reference that isn't there.
export function SourcesBlock({ sources }: { sources: PublicSourceRef[] }) {
  if (sources.length === 0) return null;

  return (
    <section aria-labelledby="sources-heading" className="mt-space-8 border-t-2 border-ink pt-space-4">
      <h2 id="sources-heading" className="text-label text-ink-muted">
        Sources
      </h2>
      <ol className="mt-space-3 divide-y divide-rule">
        {sources.map((source, index) => (
          <li key={source.name} className="flex gap-x-space-4 py-space-3 text-body-sm text-ink-secondary">
            <span className="w-6 shrink-0 text-meta tabular-nums text-ink-faint">{index + 1}</span>
            <span>
              <span className="text-ink">{source.name}</span>
              {source.note ? <span className="text-ink-muted"> — {source.note}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
