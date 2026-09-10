"use client";

import { useMemo, useState } from "react";
import { ArticleListItemView, StaffUserView } from "@/lib/api/cms-types";
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

/// docs/12 PG-EDT-06 (editor, own articles) and PG-ADM-04 (admin, the
/// same list — listArticles already omits the ownership filter for an
/// ADMIN caller) — one component, two roles. Client-side filtering over
/// one bounded fetch (docs/02 §Q: tens of articles a day) — a backend
/// query-param filter is a measured-need addition, not a day-one
/// requirement at this scale.
export function MyArticlesList({
  articles,
  users,
}: {
  articles: ArticleListItemView[];
  /// Present only for an admin caller — PG-ADM-04's author filter needs
  /// real names, which ArticleListItemView doesn't carry. undefined for
  /// an editor, who never sees the search/filter row at all.
  users?: StaffUserView[];
}) {
  const [search, setSearch] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [sectionSlug, setSectionSlug] = useState("");

  const sections = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of articles) map.set(a.category.slug, a.category.name);
    return Array.from(map, ([slug, name]) => ({ slug, name }));
  }, [articles]);

  const authors = useMemo(() => {
    if (!users) return [];
    const ownerIds = new Set(articles.map((a) => a.ownerId));
    return users.filter((u) => ownerIds.has(u.id));
  }, [articles, users]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (needle && !(a.latestRevision?.headline ?? "").toLowerCase().includes(needle)) return false;
      if (authorId && a.ownerId !== authorId) return false;
      if (sectionSlug && a.category.slug !== sectionSlug) return false;
      return true;
    });
  }, [articles, search, authorId, sectionSlug]);

  const counted = useMemo(() => {
    const buckets: Record<FilterKey, ArticleListItemView[]> = {
      DRAFT: [],
      IN_REVIEW: [],
      CHANGES_REQUESTED: [],
      PUBLISHED: [],
      REJECTED: [],
    };
    for (const article of filtered) {
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
  }, [filtered]);

  const [active, setActive] = useState<FilterKey>("DRAFT");

  const tabs: TabItem[] = (Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => ({
    key,
    label: FILTER_LABELS[key],
    count: counted[key].length,
  }));

  const activeArticles = counted[active];

  return (
    <div>
      {users ? (
        <div className="mb-space-4 flex flex-wrap gap-x-space-3 gap-y-space-2">
          <input
            type="search"
            placeholder="Search by headline…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 min-w-[200px] flex-1 rounded-sm border border-rule-strong px-space-3 text-body text-ink"
          />
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="h-10 rounded-sm border border-rule-strong px-space-3 text-body text-ink"
          >
            <option value="">All authors</option>
            {authors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}
              </option>
            ))}
          </select>
          <select
            value={sectionSlug}
            onChange={(e) => setSectionSlug(e.target.value)}
            className="h-10 rounded-sm border border-rule-strong px-space-3 text-body text-ink"
          >
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
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
