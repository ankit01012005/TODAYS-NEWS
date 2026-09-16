import { Wordmark } from "@/components/brand/Wordmark";

/// 2h "loading.tsx · skeleton, matches the real layout" — placeholders in
/// the shape of the page they stand in for, so nothing jumps when it
/// arrives. The masthead needs no data and renders for real; the nav
/// row, the Pulse band and the page body are bars. Every skeleton is
/// aria-busy and announces itself once.

export function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

function Card({ image = true, ratio = "aspect-4/3" }: { image?: boolean; ratio?: string }) {
  return (
    <div>
      {image ? <Bar className={`${ratio} w-full`} /> : null}
      <Bar className="mt-space-3 h-4 w-full" />
      <Bar className="mt-space-2 h-4 w-4/5" />
      <Bar className="mt-space-3 h-3 w-1/2" />
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <>
      <header>
        <div className="bg-surface">
          <div className="mx-auto max-w-(--width-page-max) px-space-4 md:px-space-6">
            <div className="flex items-end justify-between pb-space-3 pt-space-4 md:pb-space-4 md:pt-space-5">
              <Wordmark size="md" href={null} />
              <div className="hidden flex-col items-end gap-y-space-2 sm:flex">
                <Bar className="h-3 w-40" />
                <div className="flex gap-x-space-2">
                  <Bar className="h-7 w-16 rounded-pill" />
                  <Bar className="h-7 w-20 rounded-pill" />
                </div>
              </div>
            </div>
          </div>
          <div className="masthead-rule" />
        </div>
      </header>
      <div className="border-b border-rule bg-surface">
        <div className="mx-auto flex min-h-11 max-w-(--width-page-max) items-center gap-x-space-6 px-space-4 md:px-space-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} className="h-3 w-14" />
          ))}
        </div>
      </div>
      <div className="band-dark">
        <div className="mx-auto flex max-w-(--width-page-max) items-center gap-x-space-6 px-space-4 py-space-3 md:px-space-6">
          <span className="text-label text-gold">Pulse</span>
          <Bar className="h-2 w-52 bg-bone/20" />
          <Bar className="hidden h-2 w-64 bg-bone/20 sm:block" />
        </div>
      </div>
    </>
  );
}

export function HomeSkeleton() {
  return (
    <div className="public-site min-h-screen bg-surface" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading the latest stories</p>
      <HeaderSkeleton />
      <main className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-6 md:px-space-6">
        <div className="grid grid-cols-1 gap-y-space-6 md:grid-cols-[1fr_300px] md:gap-x-space-7">
          <div>
            <Bar className="aspect-16/9 w-full" />
            <Bar className="mt-space-4 h-6 w-16 rounded-pill" />
            <Bar className="mt-space-3 h-9 w-full" />
            <Bar className="mt-space-2 h-9 w-2/3" />
            <Bar className="mt-space-4 h-4 w-full" />
            <Bar className="mt-space-2 h-4 w-5/6" />
            <div className="mt-space-6 grid grid-cols-3 gap-x-space-4 border-t border-rule pt-space-5">
              <Card />
              <Card />
              <Card />
            </div>
          </div>
          <div className="md:border-l md:border-rule md:pl-space-5">
            <Bar className="h-3 w-16" />
            <div className="mt-space-3 divide-y divide-rule">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-space-3">
                  <Bar className="h-3 w-10" />
                  <Bar className="mt-space-2 h-4 w-full" />
                  <Bar className="mt-space-2 h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="public-site min-h-screen bg-surface" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading this section</p>
      <HeaderSkeleton />
      <main className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-6 md:px-space-6">
        <Bar className="h-10 w-48" />
        <div className="section-underline mt-space-3" />
        <Bar className="mt-space-4 h-3 w-64" />
        <div className="mt-space-6 divide-y divide-rule">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-x-space-4 py-space-4">
              <Bar className="aspect-3/2 w-[112px] shrink-0 sm:w-[150px]" />
              <div className="flex-1">
                <Bar className="h-5 w-full" />
                <Bar className="mt-space-2 h-5 w-2/3" />
                <Bar className="mt-space-3 h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="public-site min-h-screen bg-surface" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading the story</p>
      <HeaderSkeleton />
      <main>
        <div className="mx-auto max-w-(--width-measure-wide) px-space-4 pt-space-6 md:px-space-6">
          <div className="h-[2px] w-[38%] bg-brand" />
          <Bar className="mt-space-5 h-3 w-32" />
          <Bar className="mt-space-4 h-10 w-full" />
          <Bar className="mt-space-2 h-10 w-4/5" />
          <Bar className="mt-space-4 h-5 w-full" />
          <Bar className="mt-space-2 h-5 w-2/3" />
          <div className="mt-space-5 flex items-center gap-x-space-3 border-y border-rule py-space-3">
            <Bar className="h-[30px] w-[30px] rounded-pill" />
            <Bar className="h-3 w-56" />
          </div>
          <Bar className="mt-space-6 aspect-3/2 w-full" />
        </div>
        <div className="mx-auto max-w-(--width-measure) space-y-space-3 px-space-4 pt-space-7 md:px-space-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Bar key={i} className={`h-4 ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      </main>
    </div>
  );
}

export function StaticPageSkeleton() {
  return (
    <div className="public-site min-h-screen bg-surface" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading</p>
      <HeaderSkeleton />
      <main className="mx-auto max-w-(--width-measure) px-space-4 pt-space-7 md:px-space-6">
        <Bar className="h-3 w-24" />
        <Bar className="mt-space-3 h-10 w-3/4" />
        <div className="section-underline mt-space-4" />
        <div className="mt-space-6 space-y-space-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} className={`h-4 ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
          ))}
        </div>
      </main>
    </div>
  );
}
