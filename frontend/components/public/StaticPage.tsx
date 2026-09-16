import { ReactNode, ViewTransition } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";
import { TextReveal } from "@/components/motion/TextReveal";

/// Shared shell for the static pages (2b About, 2c Contact, 2d Editorial
/// policy, 2e Privacy): a red kicker, an Archivo 800 title, the 56px red
/// underline, then the copy in the reading measure. `aside` (2d's "ON
/// THIS PAGE") sits in a left column at md+. Static text, fixed at build
/// time — an explicitly acceptable V1 answer, not a gap.
export async function StaticPage({
  title,
  kicker,
  intro,
  aside,
  activePath,
  children,
}: {
  title: string;
  kicker?: string;
  intro?: string;
  aside?: ReactNode;
  activePath?: string;
  children: ReactNode;
}) {
  return (
    <PublicSite>
      <PublicHeader showPulse={false} activePath={activePath} />
      <ViewTransition default="page-fade">
        <main
          id="content"
          className={`mx-auto px-space-4 pt-space-7 md:px-space-6 md:pt-space-8 ${aside ? "max-w-(--width-page-max)" : "max-w-(--width-measure-wide)"}`}
        >
          <div className={aside ? "grid grid-cols-1 gap-x-space-8 md:grid-cols-[180px_1fr]" : ""}>
            {aside ? <div className="hidden md:block">{aside}</div> : null}
            <div className={aside ? "max-w-(--width-measure)" : ""}>
              <header>
                {kicker ? <p className="text-label-lg text-brand">{kicker}</p> : null}
                <TextReveal as="h1" text={title} className="mt-space-3 text-display-1 text-ink" />
                <div className="section-underline mt-space-4" aria-hidden="true" />
                {intro ? <p className="mt-space-4 max-w-[60ch] text-standfirst text-ink-secondary">{intro}</p> : null}
              </header>
              {aside ? <div className="mt-space-5 md:hidden">{aside}</div> : null}
              <div className="static-copy mt-space-6 space-y-space-4 text-body-lg text-ink-secondary">
                {children}
              </div>
            </div>
          </div>
        </main>
      </ViewTransition>
      <PublicFooter />
    </PublicSite>
  );
}
