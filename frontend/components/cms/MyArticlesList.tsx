"use client";

import { useMemo, useState } from "react";
import { ArticleListItemView } from "@/lib/api/cms-types";
import { ArticleListRow } from "./ArticleListRow";
import { Tabs, TabItem } from "./Tabs";

type FilterKey = "DRAFT" | "IN_REVIEW" | "CHANGES_REQUESTED" | "PUBLISHED" | "REJECTED";

const FILTER_LABELS: Record<FilterKey, string> = {
  DRAFT: "Drafts",
  IN_REVIEW: "Waiting for review",
  CHANGES_REQUESTED: "Changes requested",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

/// docs/12 PG-EDT-06 / P2-05: state filters as tabs on ONE page rather
/// than five separate pages. Client-side filtering over one bounded fetch
/// (docs/02 §Q: tens of articles a day) — a backend query-param filter is
/// a measured-need addition, not a day-one requirement at this scale.
export function MyArticlesList({ articles }: { articles: ArticleListItemView[] }) {
  const counted = useMemo(() => {
    const buckets: Record<FilterKey, ArticleListItemView[]> = {
      DRAFT: [],
      IN_REVIEW: [],
      CHANGES_REQUESTED: [],
      PUBLISHED: [],
      REJECTED: [],
    };
    for (const article of articles) {
      const state = article.latestRevision?.state;
      if (state === "DRAFT" || state === "IN_REVIEW" || state === "CHANGES_REQUESTED") {
        buckets[state].push(article);
      } else if (article.publicationStatus === "LIVE") {
        buckets.PUBLISHED.push(article);
      } else if (state === "REJECTED") {
        buckets.REJECTED.push(article);
      }
    }
    return buckets;
  }, [articles]);

  const [active, setActive] = useState<FilterKey>("DRAFT");

  const tabs: TabItem[] = (Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => ({
    key,
    label: FILTER_LABELS[key],
    count: counted[key].length,
  }));

  const activeArticles = counted[active];

  return (
    <div>
      <Tabs items={tabs} active={active} onChange={(key) => setActive(key as FilterKey)} />
      <div className="mt-space-4 rounded-md border border-rule">
        {activeArticles.length > 0 ? (
          activeArticles.map((article) => <ArticleListRow key={article.id} article={article} />)
        ) : (
          <p className="px-space-3 py-space-4 text-body-sm text-ink-muted">
            Nothing in {FILTER_LABELS[active].toLowerCase()} — that&rsquo;s good news.
          </p>
        )}
      </div>
    </div>
  );
}
