import { PublicSourceRef } from "@/lib/api/public-types";

/// docs/19 §3.9 — beneath the body, above "More in this section". The API
/// already filters to isPublic sources only (public.service.ts). Sources
/// in V1 don't carry an external link (OQ-24 didn't resolve that shape),
/// so this shows the name and any note, without implying a clickable
/// external reference that isn't there.
export function SourcesBlock({ sources }: { sources: PublicSourceRef[] }) {
  if (sources.length === 0) return null;

  return (
    <section className="mt-space-8 border-t border-rule pt-space-6">
      <h2 className="text-label text-ink-muted">Sources</h2>
      <ul className="mt-space-3 space-y-space-2">
        {sources.map((source) => (
          <li key={source.name} className="text-body-sm text-ink-secondary">
            {source.name}
            {source.note ? <span className="text-ink-muted"> — {source.note}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
