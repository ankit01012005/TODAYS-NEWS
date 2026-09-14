import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { CmsShell } from "@/components/cms/CmsShell";
import { ArticlesList } from "@/components/cms/ArticlesList";
import { Panel, StatTile, CmsEmpty } from "@/components/cms/Panel";
import { Pill } from "@/components/cms/StatusBadge";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { requireSession } from "@/lib/api/session";
import { getReviewQueue, getRevisionHistory, listMyArticles, listUsers } from "@/lib/api/cms";
import { AuthenticatedUser } from "@/lib/api/auth-types";
import { ReviewDecisionView } from "@/lib/api/cms-types";
import { formatRelative, formatWaiting, hourInSiteZone, hoursSince } from "@/lib/format-date";
import { QueueRow } from "@/components/cms/QueueRow";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

function greeting(name: string): string {
  const hour = hourInSiteZone();
  const first = name.trim().split(/\s+/)[0] ?? name;
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${part}, ${first}.`;
}

/// An admin's dashboard is a different job from an editor's — "deciding"
/// vs. "running the newsroom" — so it's a different component entirely.
export default async function DashboardPage() {
  const user = await requireSession();
  if (user.role === "ADMIN") {
    return <AdminDashboardPage user={user} />;
  }
  return <EditorDashboardPage user={user} />;
}

/// 1i — the editor desk: a greeting in the coaching voice, the gold
/// "Needs a second pass" panel listing every CHANGES_REQUESTED story with
/// what the desk asked for, four state counts, then the article list.
async function EditorDashboardPage({ user }: { user: AuthenticatedUser }) {
  const articles = await listMyArticles();

  const needsAttention = articles.filter((a) => a.latestRevision?.state === "CHANGES_REQUESTED");
  const inReview = articles.filter((a) => a.latestRevision?.state === "IN_REVIEW");
  const drafts = articles.filter((a) => a.latestRevision?.state === "DRAFT");
  const live = articles.filter((a) => a.publicationStatus === "LIVE");
  const archived = articles.filter((a) => {
    const s = a.latestRevision?.state;
    return a.publicationStatus !== "LIVE" && (s === "ARCHIVED" || s === "REJECTED" || a.publicationStatus === "WITHDRAWN");
  });

  // What the desk asked for — the latest CHANGES_REQUESTED decision per
  // story sent back. Bounded: a desk rarely has more than a handful
  // sitting with one person at once.
  const feedback = await Promise.all(
    needsAttention.slice(0, 6).map(async (article) => {
      const history = await getRevisionHistory(article.id).catch(() => []);
      const decisions: ReviewDecisionView[] = history
        .flatMap((r) => r.reviewDecisions)
        .filter((d) => d.decision === "CHANGES_REQUESTED")
        .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
      return { article, decision: decisions[0] ?? null };
    }),
  );

  const lede =
    needsAttention.length > 0
      ? `${countWord(needsAttention.length, "story is", "stories are")} waiting on you — the rest is with the desk.`
      : inReview.length > 0
        ? `${countWord(inReview.length, "story is", "stories are")} with the desk. Nothing is waiting on you.`
        : articles.length === 0
          ? "Nothing on your desk yet. Start a story and it will appear here."
          : "Nothing is waiting on you. Start something new, or pick up a draft.";

  return (
    <CmsShell user={user} width="wide">
      <Reveal>
        <h1 className="text-heading-1 text-ink">{greeting(user.displayName)}</h1>
        <p className="mt-space-1 text-body text-ink-muted">{lede}</p>
      </Reveal>

      {feedback.length > 0 ? (
        <Reveal delay={0.05} className="mt-space-5">
          <Panel tone="gold" heading="Needs a second pass" headingAside={<Pill tone="gold">{needsAttention.length}</Pill>}>
            <ul className="divide-y divide-gold/40">
              {feedback.map(({ article, decision }) => (
                <li key={article.id} className="py-space-3 first:pt-0 last:pb-0">
                  <Link href={`/staff/articles/${article.id}/edit`} className="group block no-underline">
                    <span className="text-heading-4 text-ink">
                      <span className="link-underline">{article.latestRevision?.headline || "Untitled"}</span>
                    </span>
                    <span className="mt-space-1 block text-body-sm text-gold-deep">
                      {decision?.comment ? `“${decision.comment}”` : "Sent back without a note."}
                      {decision ? ` — sent back ${formatRelative(decision.decidedAt)}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      ) : null}

      <RevealGroup className="mt-space-5 grid grid-cols-2 gap-space-3 md:grid-cols-4">
        <RevealItem>
          <StatTile label="Drafts" value={<CountUp value={drafts.length} />} />
        </RevealItem>
        <RevealItem>
          <StatTile label="In review" value={<CountUp value={inReview.length} />} tone={inReview.length > 0 ? "ink" : "muted"} />
        </RevealItem>
        <RevealItem>
          <StatTile label="Published" value={<CountUp value={live.length} />} tone="success" />
        </RevealItem>
        <RevealItem>
          <StatTile label="Archived" value={<CountUp value={archived.length} />} tone="muted" />
        </RevealItem>
      </RevealGroup>

      <Reveal delay={0.1} className="mt-space-6">
        <div className="flex items-center justify-between">
          <h2 className="text-label-lg text-ink">My articles</h2>
          <Link
            href="/staff/articles/new"
            className="inline-flex h-9 items-center gap-x-space-1 bg-accent px-space-3 text-body-sm font-medium text-paper no-underline transition-colors hover:bg-accent-hover"
          >
            <Plus size={14} aria-hidden="true" />
            Start a story
          </Link>
        </div>
        <div className="mt-space-2">
          {articles.length > 0 ? (
            <ArticlesList articles={articles} compact />
          ) : (
            <CmsEmpty
              title="Nothing here yet"
              body="Your first story starts with a headline and a section. Everything else you can change as you write."
              action={{ href: "/staff/articles/new", label: "Start a story" }}
            />
          )}
        </div>
      </Reveal>
    </CmsShell>
  );
}

/// The admin's desk: how many are waiting and for how long ("the most
/// useful number on this page is how long the oldest submission has been
/// waiting"), the queue's top rows, four counts, and what just went out.
async function AdminDashboardPage({ user }: { user: AuthenticatedUser }) {
  const [queue, articles, users] = await Promise.all([getReviewQueue(), listMyArticles(), listUsers()]);
  const oldest = queue[0] ?? null;
  const sittingWithEditors = articles.filter((a) => a.latestRevision?.state === "CHANGES_REQUESTED");
  const live = articles.filter((a) => a.publicationStatus === "LIVE");
  const archived = articles.filter((a) => a.publicationStatus !== "LIVE" && a.latestRevision?.state === "ARCHIVED");
  const recentlyPublished = [...live].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  const oldestSince = oldest ? (oldest.submittedAt ?? oldest.createdAt) : null;
  const title =
    queue.length === 0
      ? `${greeting(user.displayName)} The queue is clear.`
      : `${countWord(queue.length, "story is", "stories are")} waiting.`;
  const lede =
    queue.length === 0
      ? "Nothing is waiting for a decision. The desk is up to date."
      : oldestSince
        ? hoursSince(oldestSince) >= 24
          ? `The oldest has been in the queue for ${formatWaiting(oldestSince)} — start there.`
          : `The oldest has been waiting ${formatWaiting(oldestSince)}.`
        : "";

  return (
    <CmsShell user={user} reviewCount={queue.length} width="wide">
      <Reveal>
        <h1 className="text-heading-1 text-ink">{title}</h1>
        {lede ? <p className="mt-space-1 text-body text-ink-muted">{lede}</p> : null}
      </Reveal>

      {queue.length > 0 ? (
        <Reveal delay={0.05} className="mt-space-5">
          <Panel
            padding="none"
            heading="Review queue"
            headingAside={
              <Link href="/staff/review" className="link-underline inline-flex items-center gap-x-space-1 text-caption text-ink-muted hover:text-ink">
                Open the queue <ArrowRight size={12} aria-hidden="true" />
              </Link>
            }
          >
            {queue.slice(0, 3).map((entry, index) => (
              <QueueRow key={entry.id} entry={entry} primary={index === 0} />
            ))}
          </Panel>
        </Reveal>
      ) : null}

      <RevealGroup className="mt-space-5 grid grid-cols-2 gap-space-3 md:grid-cols-4">
        <RevealItem>
          <StatTile
            href="/staff/review"
            label="Waiting for review"
            value={<CountUp value={queue.length} />}
            tone={queue.length > 0 ? "brand" : "success"}
            detail={oldestSince ? `oldest ${formatWaiting(oldestSince)}` : "queue clear"}
          />
        </RevealItem>
        <RevealItem>
          <StatTile href="/staff/articles" label="Back with editors" value={<CountUp value={sittingWithEditors.length} />} tone={sittingWithEditors.length > 0 ? "gold" : "muted"} />
        </RevealItem>
        <RevealItem>
          <StatTile href="/staff/articles" label="Live on the site" value={<CountUp value={live.length} />} tone="success" />
        </RevealItem>
        <RevealItem>
          <StatTile href="/staff/articles" label="Archived" value={<CountUp value={archived.length} />} tone="muted" />
        </RevealItem>
      </RevealGroup>

      <Reveal delay={0.1} className="mt-space-6">
        <h2 className="text-label-lg text-ink">Recently published</h2>
        <div className="mt-space-2">
          {recentlyPublished.length > 0 ? (
            <ArticlesList articles={recentlyPublished} users={users} compact initialTab="PUBLISHED" />
          ) : (
            <CmsEmpty title="Nothing published yet." body="Approve a story from the review queue and it appears here — and on the site." />
          )}
        </div>
      </Reveal>
    </CmsShell>
  );
}

function countWord(n: number, singular: string, plural: string): string {
  const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  const word = words[n] ?? String(n);
  return `${word} ${n === 1 ? singular : plural}`;
}

