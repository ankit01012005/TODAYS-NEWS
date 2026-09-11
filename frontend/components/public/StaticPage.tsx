import { ReactNode } from "react";
import { ViewTransition } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";

/// Shared shell for the four static pages (docs/12 PG-PUB-05..08). Static
/// text, fixed at build time — an explicitly acceptable V1 answer, not a
/// gap (docs/12 P2-29). Set like a magazine's front matter: a kicker, a
/// display title over a rule, and the copy in the reading measure.
export async function StaticPage({
  title,
  kicker = "Today News",
  children,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <PublicSite>
      <PublicHeader showLatest={false} />
      <ViewTransition default="page-fade">
        <main id="content" className="mx-auto max-w-(--width-measure) px-space-4 pt-space-7 md:px-space-5 md:pt-space-8">
          <header className="border-b-2 border-ink pb-space-4">
            <p className="text-label text-brand">{kicker}</p>
            <h1 className="mt-space-2 text-display-1 text-ink">{title}</h1>
          </header>
          <div className="mt-space-6 space-y-space-4 text-body-lg text-ink-secondary [&_h2]:mt-space-6 [&_h2]:text-heading-3 [&_h2]:text-ink [&_a]:text-ink [&_a]:underline [&_a]:decoration-brand/60 [&_a]:underline-offset-4">
            {children}
          </div>
        </main>
      </ViewTransition>
      <PublicFooter />
    </PublicSite>
  );
}
