import Link from "next/link";
import { PublicArticleSummary } from "@/lib/api/public-types";
import { formatPublicTime } from "@/lib/format-date";

/// 1a — the dark "Pulse" band beneath the nav: the newest published
/// headlines scrolling horizontally, with a mono timestamp each, pausing
/// on hover or keyboard focus. Real data only — the same list the front
/// page renders, nothing marked "breaking" by hand (design handoff
/// "Gaps" 4: a separate ticker entity would be new backend work).
///
/// The list is rendered twice so the loop is seamless; the copy is
/// aria-hidden and its links are unfocusable. Speed is constant: the
/// duration scales with the number of items.
export function PulseBand({ articles }: { articles: PublicArticleSummary[] }) {
  const items = articles.slice(0, 8);
  if (items.length === 0) return null;
  const duration = `${Math.max(28, items.length * 9)}s`;

  return (
    <div className="pulse-band band-dark border-b border-bone/10">
      <div className="mx-auto flex max-w-(--width-page-max) items-center gap-x-space-4 px-space-4 md:px-space-6">
        <Link
          href="/#just-in"
          className="flex shrink-0 items-center gap-x-space-2 border-r border-bone/20 py-space-2 pr-space-4 text-label text-gold no-underline"
        >
          <span className="live-dot live-dot-sm live-dot-red" aria-hidden="true" />
          Pulse
        </Link>
        <div className="pulse-fade relative flex-1 overflow-hidden py-space-2" style={{ ["--pulse-duration" as string]: duration }}>
          <div className="pulse-track">
            <PulseList items={items} />
            <PulseList items={items} hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

function PulseList({ items, hidden = false }: { items: PublicArticleSummary[]; hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-baseline gap-x-space-7 pr-space-7" aria-hidden={hidden || undefined}>
      {items.map((article) => (
        <li key={article.slug} className="flex shrink-0 items-baseline gap-x-space-2 whitespace-nowrap">
          <time dateTime={article.publishedAt} className="text-mono-sm text-gold">
            {formatPublicTime(article.publishedAt)}
          </time>
          <Link
            href={`/${article.category.slug}/${article.slug}`}
            tabIndex={hidden ? -1 : undefined}
            className="link-underline text-body-sm text-bone/85 hover:text-bone"
          >
            {article.headline}
          </Link>
        </li>
      ))}
    </ul>
  );
}
