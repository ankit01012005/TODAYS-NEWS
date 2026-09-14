"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PublicArticleListResult, PublicArticleSummary } from "@/lib/api/public-types";
import { loadMoreInCategory, loadMorePublished } from "@/lib/actions/public";
import { StoryCard, StoryCardVariant } from "./StoryCard";

/// Cursor pagination for the section page (1e) and the search feed: the
/// first page is server-rendered by the caller; this appends the rest in
/// place via a server function, with each new batch rising in. When the
/// API returns no nextCursor the button gives way to a quiet end line.
export function LoadMoreList({
  categorySlug,
  initialCursor,
  variant = "row",
  exclude = [],
}: {
  categorySlug?: string;
  initialCursor: string | null;
  variant?: StoryCardVariant;
  exclude?: string[];
}) {
  const [pages, setPages] = useState<PublicArticleSummary[][]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const seen = new Set(exclude);

  function loadMore() {
    if (!cursor) return;
    setError(null);
    startTransition(async () => {
      try {
        const result: PublicArticleListResult = categorySlug
          ? await loadMoreInCategory(categorySlug, cursor)
          : await loadMorePublished(cursor);
        setPages((p) => [...p, result.articles]);
        setCursor(result.nextCursor);
      } catch {
        setError("Couldn’t load more right now. Try again in a moment.");
      }
    });
  }

  return (
    <div>
      <AnimatePresence initial={false}>
        {pages.map((page, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.25, 1, 0.5, 1] }}
            className="divide-y divide-rule"
          >
            {page
              .filter((article) => {
                if (seen.has(article.slug)) return false;
                seen.add(article.slug);
                return true;
              })
              .map((article) => (
                <StoryCard key={article.slug} article={article} variant={variant} className="py-space-4" />
              ))}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="mt-space-5 flex flex-col items-center gap-y-space-2">
        {error ? <p className="text-body-sm text-danger">{error}</p> : null}
        {cursor ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="inline-flex h-10 items-center gap-x-space-2 border border-ink bg-paper px-space-5 text-body-sm text-ink transition-[background-color,color] duration-(--duration-fast) hover:bg-ink hover:text-paper disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Loading…" : "Load more"}
          </button>
        ) : (
          <p className="text-caption text-ink-muted">You’ve reached the end.</p>
        )}
      </div>
    </div>
  );
}
