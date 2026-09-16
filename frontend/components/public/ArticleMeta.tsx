import Link from "next/link";
import { formatBylineTime } from "@/lib/format-date";
import { Avatar } from "./Avatar";

/// The byline rule as the CMS preview renders it (2k): the same disc,
/// name, section link and time as the public article header, with the
/// time labelled "would publish as" when the story isn't live yet.
export function ArticleMeta({
  byline,
  category,
  publishedAt,
  hypothetical = false,
  readingMinutes,
}: {
  byline: string;
  category: { name: string; slug: string };
  publishedAt: string;
  hypothetical?: boolean;
  readingMinutes?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-space-3 gap-y-space-2 border-y border-rule py-space-3 text-caption text-ink-muted">
      <Avatar name={byline || "A"} />
      <span>
        <span className="font-medium text-ink">By {byline}</span>
        <span aria-hidden="true"> · </span>
        <Link href={`/${category.slug}`} className="link-underline text-ink-muted">
          {category.name}
        </Link>
        <span aria-hidden="true"> · </span>
        {hypothetical ? <span>would publish as </span> : null}
        <time dateTime={publishedAt}>{formatBylineTime(publishedAt)}</time>
        {typeof readingMinutes === "number" ? (
          <>
            <span aria-hidden="true"> · </span>
            <span>{readingMinutes} min</span>
          </>
        ) : null}
      </span>
    </div>
  );
}
