/// docs/12 §0 — "Empty: nothing to show, and that's fine. Must explain
/// and offer a next step — never a blank area or a spinner that never
/// ends." Used for the homepage's day-one state and a section with
/// nothing published yet (docs/08 E-03).
export function EmptyState({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="py-space-10 text-center">
      <h1 className="text-heading-3 text-ink">{heading}</h1>
      <p className="mx-auto mt-space-3 max-w-(--width-measure) text-body text-ink-secondary">{body}</p>
    </div>
  );
}
