"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { AuditLogRow } from "@/lib/api/cms";
import { ArticleListItemView, StaffUserView } from "@/lib/api/cms-types";
import { formatAuditTime } from "@/lib/format-date";
import { Button } from "./Button";
import { ListFrame, PageHeader, CmsEmpty } from "./Panel";
import { Pill } from "./StatusBadge";
import { actionLabel, shortActionLabel } from "./RevisionTimeline";
import { FIELD_CLASS } from "./TextField";

function toneFor(action: string): "success" | "gold" | "brand" | "muted" | "ink" {
  if (action === "PUBLISH" || action === "APPROVE" || action === "RESTORE" || action === "REACTIVATE") return "success";
  if (action === "REQUEST_CHANGES" || action === "WITHDRAW" || action === "ARCHIVE") return "gold";
  if (action === "REJECT" || action === "UNPUBLISH" || action === "DELETE" || action === "USER_INVITE" || action === "DEACTIVATE") return "brand";
  if (action === "SUBMIT") return "ink";
  return "muted";
}

function describe(row: AuditLogRow): string {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const bits: string[] = [];
  if (typeof meta.fromState === "string" && typeof meta.toState === "string") bits.push(`${String(meta.fromState).toLowerCase()} → ${String(meta.toState).toLowerCase()}`);
  else if (typeof meta.fromState === "string") bits.push(`from ${String(meta.fromState).toLowerCase()}`);
  if (typeof meta.version === "number") bits.push(`v${meta.version}`);
  if (typeof meta.comment === "string") bits.push(`comment recorded · ${meta.comment.length} chars`);
  if (typeof meta.reason === "string") bits.push(`reason recorded · ${meta.reason.length} chars`);
  if (typeof meta.email === "string") bits.push(String(meta.email));
  if (typeof meta.role === "string") bits.push(`as ${String(meta.role)}`);
  if (typeof meta.slug === "string") bits.push(`/${meta.slug}`);
  if (typeof meta.headline === "string") bits.push(`“${meta.headline}”`);
  return bits.join(" · ");
}

/// 2s — the audit log: every consequential action, in order, newest
/// first. Nothing here can be edited or removed — the table is append-
/// only at the database level. When a story is hard-deleted its rows
/// survive with the article pointer cleared; those render as "story
/// deleted — pointer cleared, row kept" rather than a broken link.
export function AuditLog({
  rows,
  users,
  articles,
  page,
  pageSize,
}: {
  rows: AuditLogRow[];
  users: StaffUserView[];
  articles: ArticleListItemView[];
  page: number;
  pageSize: number;
}) {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");

  const nameOf = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u.displayName]));
    return (id: string | null) => (id ? (map.get(id) ?? "Former staff") : "System");
  }, [users]);
  const articleOf = useMemo(() => {
    const map = new Map(articles.map((a) => [a.id, a]));
    return (id: string | null) => (id ? (map.get(id) ?? null) : null);
  }, [articles]);

  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);
  const actors = useMemo(() => Array.from(new Set(rows.map((r) => r.actorUserId).filter((id): id is string => Boolean(id)))), [rows]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (action && row.action !== action) return false;
      if (actor && row.actorUserId !== actor) return false;
      if (needle) {
        const article = articleOf(row.articleId);
        const hay = [nameOf(row.actorUserId), row.action, row.entityType, article?.latestRevision?.headline ?? "", article?.slug ?? "", describe(row)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, search, action, actor, nameOf, articleOf]);

  function exportCsv() {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      ["when", "who", "action", "entity", "entityId", "articleId", "detail"].join(","),
      ...filtered.map((row) =>
        [row.createdAt, nameOf(row.actorUserId), row.action, row.entityType, row.entityId, row.articleId ?? "", describe(row)].map(escape).join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anvay-audit-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-space-4">
      <PageHeader
        title="Audit log"
        lede="Every consequential action, in order. Nothing here can be edited or removed."
        actions={
          <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={exportCsv} disabled={filtered.length === 0}>
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-x-space-2 gap-y-space-2">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search actor, story or action</span>
          <Search size={14} className="pointer-events-none absolute left-space-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search actor, story or action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`h-9 !pl-9 ${FIELD_CLASS} border-rule-strong text-body-sm`}
          />
        </label>
        <label className="inline-flex h-9 items-center rounded-pill border border-rule-strong bg-paper pl-space-3 text-caption text-ink">
          <span className="sr-only">Action</span>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="h-full bg-transparent pr-space-2 text-caption focus:outline-none">
            <option value="">Action</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {actionLabel(a)}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex h-9 items-center rounded-pill border border-rule-strong bg-paper pl-space-3 text-caption text-ink">
          <span className="sr-only">Actor</span>
          <select value={actor} onChange={(e) => setActor(e.target.value)} className="h-full bg-transparent pr-space-2 text-caption focus:outline-none">
            <option value="">Actor</option>
            {actors.map((id) => (
              <option key={id} value={id}>
                {nameOf(id)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ListFrame>
        <div className="hidden gap-x-space-3 border-b border-rule px-space-4 py-space-2 text-label text-ink-muted md:flex">
          <span className="w-[120px] shrink-0">When</span>
          <span className="w-[110px] shrink-0">Who</span>
          <span className="w-[150px] shrink-0">Action</span>
          <span className="flex-1">Subject</span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-space-4">
            <CmsEmpty title="Nothing recorded" body={rows.length === 0 ? "The log fills as the newsroom works." : "Try clearing a filter."} />
          </div>
        ) : (
          filtered.map((row) => {
            const article = articleOf(row.articleId);
            const deleted = row.entityType.toLowerCase().includes("article") && row.articleId === null;
            return (
              <div key={row.id} className="flex flex-wrap items-baseline gap-x-space-3 gap-y-space-1 border-b border-rule px-space-4 py-space-3 last:border-b-0">
                <span className="w-[120px] shrink-0 text-mono-sm text-ink-muted">{formatAuditTime(row.createdAt)}</span>
                <span className="w-[110px] shrink-0 truncate text-body-sm text-ink">{nameOf(row.actorUserId)}</span>
                <span className="w-[150px] shrink-0" title={actionLabel(row.action)}>
                  <Pill tone={toneFor(row.action)}>{shortActionLabel(row.action)}</Pill>
                </span>
                <span className="min-w-0 flex-1 basis-full md:basis-auto">
                  {article ? (
                    <Link href={`/staff/articles/${article.id}/history`} className="link-underline text-body-sm text-ink">
                      {article.latestRevision?.headline ?? article.publishedRevision?.headline ?? `/${article.slug}`}
                    </Link>
                  ) : deleted ? (
                    <span className="text-body-sm italic text-ink-muted">story deleted — pointer cleared, row kept</span>
                  ) : (
                    <span className="text-body-sm text-ink">{row.entityType.toLowerCase().replace(/_/g, " ")}</span>
                  )}
                  {describe(row) ? <span className="mt-space-1 block text-mono-sm text-ink-muted">{describe(row)}</span> : null}
                </span>
              </div>
            );
          })
        )}
      </ListFrame>

      <div className="flex items-center justify-between">
        <span className="text-mono-sm text-ink-muted">
          page {page} · {filtered.length} of {rows.length} on this page
        </span>
        <div className="flex gap-x-space-2">
          {page > 1 ? (
            <Link href={`/staff/audit?page=${page - 1}`} className="inline-flex h-8 items-center border border-ink bg-paper px-space-3 text-body-sm text-ink no-underline hover:bg-ink hover:text-paper">
              ‹ Newer
            </Link>
          ) : null}
          {rows.length === pageSize ? (
            <Link href={`/staff/audit?page=${page + 1}`} className="inline-flex h-8 items-center border border-ink bg-paper px-space-3 text-body-sm text-ink no-underline hover:bg-ink hover:text-paper">
              Older ›
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
