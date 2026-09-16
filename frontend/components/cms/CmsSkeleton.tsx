import { Wordmark } from "@/components/brand/Wordmark";
import { Bar } from "@/components/public/Skeletons";

/// 2t "Slow — honest about it". Each CMS page fans out into several API
/// calls and every one is a round trip to a distant database: skeletons,
/// not spinners, and never a blocked screen. The chrome renders for real;
/// the nav and content are bars in the shape of a list page.
export function CmsSkeleton() {
  return (
    <div className="min-h-screen bg-surface-soft" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading the newsroom</p>
      <header className="band-dark sticky top-0 z-(--z-nav) border-b border-bone/10">
        <div className="mx-auto flex h-14 max-w-(--width-page-max-cms) items-center justify-between px-space-4 md:px-space-6">
          <div className="flex items-center gap-x-space-3">
            <Wordmark size="xs" tone="bone" pulse={false} href={null} />
            <span className="hidden text-body-sm text-bone/60 sm:inline">Newsroom</span>
          </div>
          <Bar className="h-7 w-24 rounded-pill bg-bone/15" />
        </div>
      </header>
      <div className="mx-auto flex max-w-(--width-page-max-cms) flex-col md:flex-row">
        <div className="shrink-0 border-b border-rule bg-surface md:w-[188px] md:border-b-0 md:border-r">
          <div className="flex gap-x-space-4 px-space-4 py-space-3 md:flex-col md:gap-y-space-2 md:py-space-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bar key={i} className="h-4 w-24" />
            ))}
          </div>
        </div>
        <main className="min-w-0 flex-1 px-space-4 py-space-5 md:px-space-6 md:py-space-6">
          <div className="max-w-[960px]">
            <Bar className="h-8 w-64" />
            <Bar className="mt-space-2 h-4 w-80" />
            <div className="mt-space-5 grid grid-cols-2 gap-space-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bar key={i} className="h-20" />
              ))}
            </div>
            <div className="mt-space-6 border border-rule-strong bg-paper">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-x-space-3 border-b border-rule px-space-4 py-space-3 last:border-b-0">
                  <Bar className="h-6 w-24 rounded-pill" />
                  <Bar className="h-4 flex-1" />
                  <Bar className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
