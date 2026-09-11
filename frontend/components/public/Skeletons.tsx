import { SITE_NAME } from "@/lib/site";

/// Brief §22 — skeletons that match the shape of the content they stand
/// in for, so nothing jumps when it arrives (PRF-08). The masthead needs
/// no data and renders for real; only the nav row and the page body are
/// placeholders. Every skeleton is aria-busy and announces itself once.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-sm ${className}`} aria-hidden="true" />;
}

function Card({ image = true }: { image?: boolean }) {
  return (
    <div>
      {image ? <Bar className="aspect-3/2 w-full rounded-none" /> : null}
      <Bar className="mt-space-3 h-3 w-16" />
      <Bar className="mt-space-3 h-6 w-full" />
      <Bar className="mt-space-2 h-6 w-4/5" />
      <Bar className="mt-space-3 h-3 w-1/2" />
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <>
      <header>
        <div className="surface-band">
          <div className="mx-auto max-w-(--width-page-max) px-space-4 md:px-space-5">
            <div className="flex items-center justify-between border-b border-rule py-space-2">
              <Bar className="h-3 w-40" />
              <Bar className="h-3 w-16" />
            </div>
            <div className="flex flex-col items-center py-space-5 md:py-space-6">
              <span className="text-wordmark text-[42px] text-ink sm:text-[56px] md:text-[72px]">
                {SITE_NAME}
                <span className="text-brand" aria-hidden="true">
                  .
                </span>
              </span>
            </div>
          </div>
          <div className="border-b-2 border-brand" />
        </div>
      </header>
      <div className="border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-(--width-page-max) justify-center gap-x-space-7 px-space-4 py-space-3 md:px-space-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>
    </>
  );
}

export function HomeSkeleton() {
  return (
    <div className="public-site" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading the latest stories</p>
      <HeaderSkeleton />
      <main className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-6 md:px-space-5 md:pt-space-7">
        <div className="grid grid-cols-1 gap-y-space-6 md:grid-cols-12 md:gap-x-space-6">
          <div className="md:col-span-8">
            <Bar className="aspect-16/10 w-full rounded-none" />
            <Bar className="mt-space-5 h-3 w-20" />
            <Bar className="mt-space-3 h-12 w-full" />
            <Bar className="mt-space-2 h-12 w-3/4" />
            <Bar className="mt-space-4 h-5 w-2/3" />
          </div>
          <div className="space-y-space-6 md:col-span-4 md:border-l md:border-rule md:pl-space-6">
            <Card />
            <Card image={false} />
            <Card image={false} />
          </div>
        </div>
        <div className="mt-space-9 grid grid-cols-1 gap-x-space-6 gap-y-space-6 sm:grid-cols-2 md:grid-cols-3">
          <Card />
          <Card />
          <Card />
        </div>
      </main>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="public-site" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading this section</p>
      <HeaderSkeleton />
      <main className="mx-auto max-w-(--width-page-max) px-space-4 pt-space-6 md:px-space-5 md:pt-space-7">
        <div className="border-b-2 border-ink pb-space-4">
          <Bar className="h-3 w-16" />
          <Bar className="mt-space-3 h-12 w-64" />
        </div>
        <div className="mt-space-6 grid grid-cols-1 gap-y-space-6 md:grid-cols-12 md:gap-x-space-6">
          <div className="md:col-span-8">
            <Bar className="aspect-16/10 w-full rounded-none" />
            <Bar className="mt-space-4 h-8 w-4/5" />
          </div>
          <div className="space-y-space-6 md:col-span-4">
            <Card image={false} />
            <Card image={false} />
          </div>
        </div>
        <div className="mt-space-8 grid grid-cols-1 gap-x-space-6 gap-y-space-7 sm:grid-cols-2 md:grid-cols-3">
          <Card />
          <Card />
          <Card />
        </div>
      </main>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="public-site" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading the story</p>
      <HeaderSkeleton />
      <main>
        <div className="mx-auto max-w-(--width-measure-wide) px-space-4 pt-space-8 md:px-space-5">
          <div className="flex flex-col items-center">
            <Bar className="h-3 w-20" />
            <Bar className="mt-space-4 h-12 w-full" />
            <Bar className="mt-space-2 h-12 w-5/6" />
            <Bar className="mt-space-5 h-6 w-3/4" />
            <Bar className="mt-space-6 h-4 w-1/2" />
          </div>
        </div>
        <div className="mx-auto mt-space-7 max-w-[1120px] px-space-4 md:px-space-5">
          <Bar className="aspect-16/9 w-full rounded-none" />
        </div>
        <div className="mx-auto max-w-(--width-measure) space-y-space-3 px-space-4 pt-space-8 md:px-space-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Bar key={i} className={`h-5 ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      </main>
    </div>
  );
}
