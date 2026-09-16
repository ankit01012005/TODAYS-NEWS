"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, History, MoreHorizontal, Pencil, Search } from "lucide-react";
import { ArticleListItemView, RevisionState, StaffUserView } from "@/lib/api/cms-types";
import { formatRelative } from "@/lib/format-date";
import { LiveBadge, StatusBadge, stateLabel } from "./StatusBadge";
import { Tabs, TabItem } from "./Tabs";
import { FIELD_CLASS } from "./TextField";
import { CmsEmpty, ListFrame } from "./Panel";

type TabKey = "OPEN" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

const TAB_LABELS: Record<TabKey, string> = {
  OPEN: "Open",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

const OPEN_STATES: RevisionState[] = ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED"];

/// Which tab a story belongs to. A live story with an open correction
/// shows under Published (it is what readers see) with a "+ draft" pill
/// — the case the data model makes possible and the list must show (2i).
export function bucketOf(article: ArticleListItemView): TabKey {
  const state = article.latestRevision?.state;
  if (article.publicationStatus === "LIVE") return "PUBLISHED";
  if (state && OPEN_STATES.includes(state)) return "OPEN";
  if (state === "REJECTED") return "REJECTED";
  return "ARCHIVED";
}

/// 2i — the article list: Open / Published / Archived tabs partitioning
/// one bounded fetch, an admin-only filter row (search headline or slug,
/// state, section, owner, sort), and a table whose columns the eye
/// learns once: STATE · HEADLINE · SECTION · OWNER · UPDATED · menu.
/// Used by both dashboards (compact) and /staff/articles (full).
export function ArticlesList({
  articles,
  users,
  compact = false,
  viewerIsAdmin = false,
  initialTab = "OPEN",
}: {
  articles: ArticleListItemView[];
  /// The staff directory — admin only, for the owner column and filter.
  users?: StaffUserView[];
  compact?: boolean;
  viewerIsAdmin?: boolean;
  initialTab?: TabKey;
}) {
  const [search, setSearch] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [sectionSlug, setSectionSlug] = useState("");
  const [stateFilter, setStateFilter] = useState<RevisionState | "">("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  // Open on the requested tab, or — when it is empty — the first tab
  // with something in it, so a desk with only published stories doesn't
  // land on "Nothing open".
  const [active, setActive] = useState<TabKey>(() => {
    const has = (key: TabKey) => articles.some((a) => bucketOf(a) === key);
    if (has(initialTab)) return initialTab;
    return (["OPEN", "PUBLISHED", "REJECTED", "ARCHIVED"] as TabKey[]).find(has) ?? initialTab;
  });

  const nameOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users ?? []) map.set(u.id, u.displayName);
    return (id: string) => map.get(id) ?? "—";
  }, [users]);

  const sections = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of articles) map.set(a.category.slug, a.category.name);
    return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [articles]);

  const owners = useMemo(() => {
    if (!users) return [];
    const ownerIds = new Set(articles.map((a) => a.ownerId));
    return users.filter((u) => ownerIds.has(u.id));
  }, [articles, users]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = articles.filter((a) => {
      const headline = (a.latestRevision?.headline ?? a.publishedRevision?.headline ?? "").toLowerCase();
      if (needle && !headline.includes(needle) && !a.slug.toLowerCase().includes(needle)) return false;
      if (ownerId && a.ownerId !== ownerId) return false;
      if (sectionSlug && a.category.slug !== sectionSlug) return false;
      if (stateFilter && a.latestRevision?.state !== stateFilter) return false;
      return true;
    });
    return list.sort((a, b) =>
      sort === "newest" ? b.updatedAt.localeCompare(a.updatedAt) : a.updatedAt.localeCompare(b.updatedAt),
    );
  }, [articles, search, ownerId, sectionSlug, stateFilter, sort]);

  const buckets = useMemo(() => {
    const b: Record<TabKey, ArticleListItemView[]> = { OPEN: [], PUBLISHED: [], REJECTED: [], ARCHIVED: [] };
    for (const article of filtered) b[bucketOf(article)].push(article);
    return b;
  }, [filtered]);

  const tabs: TabItem[] = (Object.keys(TAB_LABELS) as TabKey[])
    .filter((key) => key !== "REJECTED" || buckets.REJECTED.length > 0 || active === "REJECTED")
    .map((key) => ({ key, label: TAB_LABELS[key], count: buckets[key].length }));

  const rows = buckets[active];
  const showOwner = Boolean(users);

  return (
    <div>
      {!compact && viewerIsAdmin ? (
        <div className="mb-space-3 flex flex-wrap items-center gap-x-space-2 gap-y-space-2">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search headline or slug</span>
            <Search size={14} className="pointer-events-none absolute left-space-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search headline or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`h-9 !pl-9 ${FIELD_CLASS} border-rule-strong text-body-sm`}
            />
          </label>
          <FilterSelect label="State" value={stateFilter} onChange={(v) => setStateFilter(v as RevisionState | "")}>
            <option value="">State</option>
            {(["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as RevisionState[]).map((s) => (
              <option key={s} value={s}>
                {stateLabel(s)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Section" value={sectionSlug} onChange={setSectionSlug}>
            <option value="">Section</option>
            {sections.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Owner" value={ownerId} onChange={setOwnerId}>
            <option value="">Owner</option>
            {owners.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Sort" value={sort} onChange={(v) => setSort(v as "newest" | "oldest")}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </FilterSelect>
        </div>
      ) : null}

      <Tabs id={compact ? "dash-tabs" : "list-tabs"} items={tabs} active={active} onChange={(key) => setActive(key as TabKey)} />

      <ListFrame className="mt-0 border-t-0">
        {!compact ? (
          <div className="hidden gap-x-space-3 border-b border-rule px-space-4 py-space-2 text-label text-ink-muted md:flex">
            <span className="w-[150px] shrink-0">State</span>
            <span className="flex-1">Headline</span>
            <span className="w-[96px] shrink-0">Section</span>
            {showOwner ? <span className="w-[110px] shrink-0">Owner</span> : null}
            <span className="w-[84px] shrink-0">Updated</span>
            <span className="w-8 shrink-0" />
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {rows.length > 0 ? (
              rows.map((article) => (
                <ArticleRow key={article.id} article={article} ownerName={showOwner ? nameOf(article.ownerId) : null} compact={compact} />
              ))
            ) : (
              <div className="p-space-4">
                <CmsEmpty
                  title={
                    active === "OPEN"
                      ? "Nothing open — that’s a clear desk."
                      : active === "PUBLISHED"
                        ? "Nothing published yet."
                        : `Nothing ${TAB_LABELS[active].toLowerCase()}.`
                  }
                  body={search || ownerId || sectionSlug || stateFilter ? "Try clearing a filter." : undefined}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </ListFrame>

      {!compact ? (
        <p className="mt-space-2 text-mono-sm text-ink-muted">
          showing {rows.length} of {filtered.length}
          {articles.length >= 100 ? " · the list stops at 100 stories" : ""}
        </p>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="inline-flex h-9 items-center rounded-pill border border-rule-strong bg-paper pl-space-3 text-caption text-ink">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-full bg-transparent pr-space-2 text-caption focus:outline-none">
        {children}
      </select>
    </label>
  );
}

function ArticleRow({
  article,
  ownerName,
  compact,
}: {
  article: ArticleListItemView;
  ownerName: string | null;
  compact: boolean;
}) {
  const current = article.latestRevision ?? article.publishedRevision;
  const openState = article.latestRevision && article.latestRevision.id !== article.publishedRevision?.id ? article.latestRevision.state : null;
  const isLive = article.publicationStatus === "LIVE";
  const highlight = openState === "CHANGES_REQUESTED";

  return (
    <div
      className={`group relative flex flex-wrap items-center gap-x-space-3 gap-y-space-2 border-b border-rule px-space-4 py-space-3 transition-colors duration-(--duration-fast) last:border-b-0 hover:bg-surface-sunken ${
        highlight ? "bg-gold-wash hover:bg-gold-wash" : ""
      }`}
    >
      <span className={`flex shrink-0 flex-wrap items-center gap-x-space-1 gap-y-space-1 ${compact ? "" : "md:w-[150px]"}`}>
        {isLive ? <LiveBadge /> : null}
        {openState && (!isLive || openState !== "PUBLISHED") ? (
          isLive ? (
            <span className="inline-flex h-6 items-center rounded-pill border border-rule-strong px-space-2 text-label text-ink-muted">+ {stateLabel(openState).toLowerCase()}</span>
          ) : (
            <StatusBadge state={openState} />
          )
        ) : null}
        {!isLive && !openState && current ? <StatusBadge state={current.state} /> : null}
      </span>
      <Link
        href={`/staff/articles/${article.id}/edit`}
        className="min-w-0 basis-full truncate text-body text-ink no-underline after:absolute after:inset-0 after:content-[''] md:flex-1 md:basis-auto"
      >
        <span className="link-underline">{current?.headline ?? <span className="text-ink-faint">Untitled</span>}</span>
      </Link>
      <span className={`shrink-0 truncate text-body-sm text-ink-muted ${compact ? "" : "md:w-[96px]"}`}>{article.category.name}</span>
      {ownerName ? <span className={`shrink-0 truncate text-body-sm text-ink-muted ${compact ? "" : "md:w-[110px]"}`}>{ownerName}</span> : null}
      <span className={`shrink-0 text-mono-sm tabular-nums text-ink-muted ${compact ? "" : "md:w-[84px]"}`}>{formatRelative(article.updatedAt)}</span>
      {!compact ? (
        <details className="relative z-10 w-8 shrink-0">
          <summary
            aria-label="More actions"
            className="grid h-8 w-8 cursor-pointer list-none place-items-center text-ink-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden"
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </summary>
          <div className="enter-rise absolute right-0 top-full z-20 mt-space-1 w-40 border border-ink bg-paper py-space-1 shadow-depth-2">
            <RowMenuLink href={`/staff/articles/${article.id}/edit`} icon={<Pencil size={13} />} label="Open" />
            <RowMenuLink href={`/staff/articles/${article.id}/preview`} icon={<Eye size={13} />} label="Preview" />
            <RowMenuLink href={`/staff/articles/${article.id}/history`} icon={<History size={13} />} label="History" />
          </div>
        </details>
      ) : null}
    </div>
  );
}

function RowMenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-x-space-2 px-space-3 py-space-2 text-body-sm text-ink no-underline hover:bg-surface-sunken">
      <span className="text-ink-muted" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Link>
  );
}
