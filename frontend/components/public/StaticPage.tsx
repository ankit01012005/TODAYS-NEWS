import { ReactNode } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

/// Shared shell for the four static pages (docs/12 PG-PUB-05..08). Static
/// text, fixed at build time — an explicitly acceptable V1 answer, not a
/// gap (docs/12 P2-29).
export async function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-(--width-measure) px-space-4 py-space-6 md:px-space-5">
        <h1 className="text-heading-1 text-ink">{title}</h1>
        <div className="mt-space-5 space-y-space-4 text-body text-ink-secondary">{children}</div>
      </main>
      <PublicFooter />
    </>
  );
}
