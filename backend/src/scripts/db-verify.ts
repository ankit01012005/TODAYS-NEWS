/// Database verification — the checks that must pass before a release is
/// allowed to touch a database, and again after migrations have run.
///
///   npm run db:verify -- --stage=pre     before `prisma migrate deploy`
///   npm run db:verify -- --stage=post    after it (the default)
///   npm run db:verify -- --stage=all
///
/// Exit code 0 = every check passed (warnings allowed), 1 = at least one
/// FAIL. That makes it usable as a release gate (.github/workflows) and as
/// a post-deploy smoke check, not just something a human reads.
///
/// Why "before and after creation" are different check sets:
///   pre  — the database exists but the schema may not. Answers "is this
///          the right server, can we reach it, are we allowed to change
///          it, and is it the one we think it is?" Running the wrong
///          migration against production is the failure this prevents.
///   post — the schema is there. Answers "did every migration land, are
///          the invariants that only exist as triggers and constraints
///          actually present, and does the live data still satisfy them?"
///          Prisma's own `migrate status` checks the ledger and nothing
///          else: a trigger dropped by hand leaves the ledger pristine.
///
/// Read-only. Nothing here writes, so it is safe against production.

import { prisma } from "../db";
import { isTransient } from "../common/prisma-errors";

/// Read straight from the environment rather than through config.ts: this
/// script checks a DATABASE_URL and nothing else, and importing config
/// would make it refuse to run without unrelated settings (a Cloudinary
/// URL, a mail transport) that have no bearing on whether the schema is
/// sound. It has to be runnable against a bare database in CI.
const nodeEnv = process.env.NODE_ENV ?? "development";

type Status = "PASS" | "WARN" | "FAIL" | "SKIP";

interface Result {
  name: string;
  status: Status;
  detail: string;
}

const results: Result[] = [];

/// Set the moment a check fails because the database is unreachable. Every
/// later check would fail the same way for the same reason, and a report of
/// two dozen identical connection errors buries the one fact that matters.
/// They are skipped instead, and the report says so.
let unreachable: string | null = null;

function record(name: string, status: Status, detail: string): void {
  results.push({ name, status, detail });
}

/// Every check runs even if an earlier one failed — one run should produce
/// the whole picture, not the first problem and a mystery. The exception is
/// a lost connection, which makes the rest meaningless.
async function check(name: string, run: () => Promise<[Status, string]>): Promise<void> {
  if (unreachable) {
    record(name, "SKIP", "database unreachable");
    return;
  }
  try {
    const [status, detail] = await run();
    record(name, status, detail);
  } catch (error) {
    if (isTransient(error)) {
      unreachable = firstLine(error);
      record(name, "FAIL", unreachable);
      return;
    }
    record(name, "FAIL", firstLine(error));
  }
}

/// Prisma's errors are several paragraphs: a header naming the call, the
/// echoed query, the actual reason, then advice. In a checklist only the
/// reason is wanted — "Can't reach database server at …", not "Invalid
/// `prisma.$queryRaw()` invocation:".
function firstLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.endsWith("invocation:") && !line.startsWith("Please make sure"));
  return lines[0] ?? message.split("\n")[0] ?? message;
}

async function scalar<T>(sql: string): Promise<T> {
  const rows = await prisma.$queryRawUnsafe<Record<string, T>[]>(sql);
  return Object.values(rows[0] ?? {})[0] as T;
}

async function rows<T extends Record<string, unknown>>(sql: string): Promise<T[]> {
  return prisma.$queryRawUnsafe<T[]>(sql);
}

// ---------------------------------------------------------------------------
// The schema this build expects. Kept as literal lists rather than derived
// from schema.prisma on purpose: this file is the independent witness. If
// it were generated from the same source as the migrations, it could only
// ever agree with them.
// ---------------------------------------------------------------------------

const EXPECTED_TABLES = [
  "article_revisions",
  "article_sources",
  "articles",
  "audit_logs",
  "categories",
  "media_assets",
  "review_decisions",
  "sessions",
  "social_picks",
  "sources",
  "users",
];

/// The invariants that exist ONLY as database objects. Every one of these
/// is a rule the application also enforces; the trigger is what holds when
/// something reaches the database another way (a console, a fix-up script,
/// a future service). Losing one is invisible until it matters.
const EXPECTED_TRIGGERS: Record<string, string> = {
  trg_articles_slug_immutable: "BR-15 — a published slug can never change",
  trg_articles_bump_version: "P2-23 — optimistic concurrency on articles",
  trg_article_revisions_bump_version: "P2-23 — optimistic concurrency on revisions",
  trg_article_revisions_sync_markers: "I-1/I-2 — one open and one published revision per article",
  trg_audit_logs_no_update: "SEC-11 — the audit log is append-only",
  trg_audit_logs_no_delete: "SEC-11 — the audit log is append-only",
  trg_review_decisions_no_update: "review decisions are immutable",
  trg_review_decisions_no_delete: "review decisions are immutable",
  trg_categories_no_deactivate_while_live: "P2-21 — a section with live stories stays open",
  trg_users_at_most_one_active_admin: "BR-14 — never more than one active admin",
  trg_users_at_least_one_active_admin: "BR-14 — never zero active admins",
};

// ---------------------------------------------------------------------------
// Stage: pre — before the schema is created or migrated
// ---------------------------------------------------------------------------

async function preChecks(): Promise<void> {
  await check("connectivity", async () => {
    const started = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const ms = Date.now() - started;
    // A remote database is normal here (docs/23 §9) — but a slow link
    // multiplies across the 6–10 statements in a publish transaction.
    return [ms > 1000 ? "WARN" : "PASS", `reachable in ${ms}ms`];
  });

  await check("server version", async () => {
    const version = await scalar<string>("SHOW server_version");
    const major = Number.parseInt(version, 10);
    // gen_random_uuid() is built in from 13; the migrations assume it.
    return [major >= 13 ? "PASS" : "FAIL", `PostgreSQL ${version}`];
  });

  await check("connection is encrypted", async () => {
    // Credentials and article drafts cross the public internet to a
    // managed provider; an unencrypted link would expose both.
    const ssl = await rows<{ ssl: boolean }>(
      "SELECT coalesce(bool_or(ssl), false) AS ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()",
    ).catch(() => [{ ssl: false }]);
    const encrypted = ssl[0]?.ssl === true;
    if (encrypted) return ["PASS", "TLS in use"];
    return [nodeEnv === "production" ? "FAIL" : "WARN", "connection is NOT encrypted"];
  });

  await check("runtime user is not a superuser", async () => {
    // SEC — the application should not be able to disable its own
    // triggers, read other databases, or write to the filesystem.
    const superuser = await scalar<boolean>(
      "SELECT usesuper FROM pg_user WHERE usename = current_user",
    );
    if (!superuser) return ["PASS", `${await scalar<string>("SELECT current_user")} is unprivileged`];
    return [
      nodeEnv === "production" ? "FAIL" : "WARN",
      "the application connects as a SUPERUSER — it can bypass every trigger in this schema",
    ];
  });

  await check("target database identity", async () => {
    const name = await scalar<string>("SELECT current_database()");
    const schema = await scalar<string>("SELECT current_schema()");
    // Printed, not judged: a human reading a release log needs to see
    // which database the migration is about to change.
    return ["PASS", `${name} / ${schema} (NODE_ENV=${nodeEnv})`];
  });

  await check("schema state before migrating", async () => {
    const tables = await rows<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    const names = tables.map((t) => t.table_name);
    const ours = EXPECTED_TABLES.filter((t) => names.includes(t));
    if (names.length === 0) return ["PASS", "empty database — a first migration will create everything"];
    if (ours.length === 0) return ["WARN", `${names.length} table(s) present, none of them ours`];
    return ["PASS", `${ours.length}/${EXPECTED_TABLES.length} application tables already present`];
  });

  await check("no unexpected tables in the schema", async () => {
    // Redundancy check: anything in `public` that no migration created is
    // either a leftover (Neon's sample table, a hand-made scratch copy) or
    // something nobody has documented. Either way an operator should know.
    const tables = await rows<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    const known = new Set([...EXPECTED_TABLES, "_prisma_migrations"]);
    const strays = tables.map((t) => t.table_name).filter((name) => !known.has(name));
    if (strays.length === 0) return ["PASS", "nothing but the application's own tables"];
    return ["WARN", `not created by any migration: ${strays.join(", ")}`];
  });
}

// ---------------------------------------------------------------------------
// Stage: post — after `prisma migrate deploy`
// ---------------------------------------------------------------------------

async function postChecks(): Promise<void> {
  await check("migrations applied cleanly", async () => {
    const ledger = await rows<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>(
      "SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at",
    );
    if (ledger.length === 0) return ["FAIL", "no migrations recorded — the schema was never created"];

    const unfinished = ledger.filter((m) => m.finished_at === null);
    const rolledBack = ledger.filter((m) => m.rolled_back_at !== null);
    if (rolledBack.length > 0) {
      return ["FAIL", `rolled back: ${rolledBack.map((m) => m.migration_name).join(", ")}`];
    }
    if (unfinished.length > 0) {
      // A partially applied migration is the worst state to deploy over.
      return ["FAIL", `never finished: ${unfinished.map((m) => m.migration_name).join(", ")}`];
    }
    return ["PASS", `${ledger.length} applied, latest ${ledger[ledger.length - 1].migration_name}`];
  });

  await check("every expected table exists", async () => {
    const present = (
      await rows<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      )
    ).map((t) => t.table_name);
    const missing = EXPECTED_TABLES.filter((t) => !present.includes(t));
    return missing.length === 0
      ? ["PASS", `${EXPECTED_TABLES.length} tables`]
      : ["FAIL", `missing: ${missing.join(", ")}`];
  });

  await check("every invariant trigger is installed", async () => {
    const present = new Set(
      (
        await rows<{ tgname: string }>(
          `SELECT t.tgname FROM pg_trigger t
             JOIN pg_class c ON c.oid = t.tgrelid
             JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND NOT t.tgisinternal`,
        )
      ).map((t) => t.tgname),
    );
    const missing = Object.entries(EXPECTED_TRIGGERS).filter(([name]) => !present.has(name));
    if (missing.length === 0) return ["PASS", `${Object.keys(EXPECTED_TRIGGERS).length} triggers present`];
    return ["FAIL", missing.map(([name, why]) => `${name} (${why})`).join("; ")];
  });

  await check("foreign keys and unique constraints are enforced", async () => {
    const counts = await rows<{ contype: string; n: bigint }>(
      `SELECT contype, count(*) AS n FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public' GROUP BY contype`,
    );
    const by = Object.fromEntries(counts.map((c) => [c.contype, Number(c.n)]));
    const fk = by.f ?? 0;
    const unique = by.u ?? 0;
    const checks = by.c ?? 0;
    // The composite FK that makes Article.currentPublishedRevisionId
    // unable to point at another article's revision (I-3) is one of these.
    if (fk === 0 || unique === 0) return ["FAIL", `foreign keys: ${fk}, unique: ${unique}`];
    return ["PASS", `${fk} foreign keys, ${unique} unique, ${checks} check constraints`];
  });

  await check("no constraint is NOT VALID", async () => {
    // A constraint added NOT VALID is enforced for new rows but was never
    // checked against the existing ones — it looks present and is not.
    const invalid = await rows<{ conname: string }>(
      `SELECT conname FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public' AND NOT c.convalidated`,
    );
    return invalid.length === 0
      ? ["PASS", "all constraints validated"]
      : ["FAIL", `not validated: ${invalid.map((c) => c.conname).join(", ")}`];
  });

  await check("public read path is indexed", async () => {
    // docs/23 §9.5 — the homepage and section queries sort on these. A
    // missing index here is a slow site, not a broken one, so it warns.
    const indexes = new Set(
      (
        await rows<{ indexname: string }>(
          "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'",
        )
      ).map((i) => i.indexname),
    );
    const wanted = [
      "articles_publication_status_published_at_idx",
      "articles_category_id_publication_status_published_at_idx",
      "article_revisions_state_submitted_at_idx",
    ];
    const missing = wanted.filter((i) => !indexes.has(i));
    return missing.length === 0
      ? ["PASS", `${indexes.size} indexes, including the public read path`]
      : ["WARN", `missing: ${missing.join(", ")}`];
  });

  // --- Data-level invariants: the rules above, tested against real rows ---

  await check("I-1 one open revision per article", async () => {
    const n = await scalar<bigint>(
      `SELECT count(*) FROM (SELECT article_id FROM article_revisions
        WHERE state IN ('DRAFT','IN_REVIEW','CHANGES_REQUESTED','APPROVED')
        GROUP BY article_id HAVING count(*) > 1) x`,
    );
    return Number(n) === 0 ? ["PASS", "no article has two open revisions"] : ["FAIL", `${n} article(s) violate I-1`];
  });

  await check("I-2 one published revision per article", async () => {
    const n = await scalar<bigint>(
      `SELECT count(*) FROM (SELECT article_id FROM article_revisions
        WHERE state = 'PUBLISHED' GROUP BY article_id HAVING count(*) > 1) x`,
    );
    return Number(n) === 0 ? ["PASS", "no article has two published revisions"] : ["FAIL", `${n} violate I-2`];
  });

  await check("I-3 published pointer belongs to its own article", async () => {
    const n = await scalar<bigint>(
      `SELECT count(*) FROM articles a JOIN article_revisions r
         ON r.id = a.current_published_revision_id AND r.article_id <> a.id`,
    );
    return Number(n) === 0 ? ["PASS", "every pointer is self-consistent"] : ["FAIL", `${n} cross-article pointers`];
  });

  await check("I-4 LIVE exactly when a published revision is pointed at", async () => {
    const orphanLive = await scalar<bigint>(
      "SELECT count(*) FROM articles WHERE publication_status = 'LIVE' AND current_published_revision_id IS NULL",
    );
    const pointerNotLive = await scalar<bigint>(
      "SELECT count(*) FROM articles WHERE current_published_revision_id IS NOT NULL AND publication_status <> 'LIVE'",
    );
    if (Number(orphanLive) === 0 && Number(pointerNotLive) === 0) return ["PASS", "status and pointer agree"];
    return ["FAIL", `LIVE without a revision: ${orphanLive}; pointer while not LIVE: ${pointerNotLive}`];
  });

  await check("markers match revision state", async () => {
    // open_marker/published_marker are derived by trigger. Drift means the
    // trigger stopped firing — and the partial-uniqueness guarantees that
    // rest on them (I-1, I-2) silently stopped holding.
    const drift = await scalar<bigint>(
      `SELECT count(*) FROM article_revisions
        WHERE (state IN ('DRAFT','IN_REVIEW','CHANGES_REQUESTED','APPROVED')) <> (open_marker IS TRUE)
           OR (state = 'PUBLISHED') <> (published_marker IS TRUE)`,
    );
    return Number(drift) === 0 ? ["PASS", "no marker drift"] : ["FAIL", `${drift} revision(s) drifted`];
  });

  await check("BR-14 exactly one active admin", async () => {
    // A database that has just been migrated has no accounts at all, and
    // that is not a violation — BR-14 governs a newsroom in use, and its
    // "never zero" trigger fires on UPDATE and DELETE, so it cannot be
    // broken by an empty table. The first admin arrives out of band
    // afterwards (`npm run db:bootstrap-admin`). Reporting FAIL here made
    // the check unusable in exactly the place it is most wanted: verifying
    // a fresh database in CI, and verifying a restored backup before
    // anyone has signed in.
    const users = Number(await scalar<bigint>("SELECT count(*) FROM users"));
    if (users === 0) {
      return ["PASS", "no accounts yet — freshly created; BR-14 applies from the first one"];
    }

    const n = Number(
      await scalar<bigint>("SELECT count(*) FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'"),
    );
    if (n === 1) return ["PASS", "one active admin"];
    if (n === 0) return ["FAIL", "no active admin — nobody can publish or manage staff"];
    return ["FAIL", `${n} active admins — BR-14 allows exactly one`];
  });

  await check("every published revision records who published it", async () => {
    const n = await scalar<bigint>(
      "SELECT count(*) FROM article_revisions WHERE state = 'PUBLISHED' AND (published_at IS NULL OR published_by_user_id IS NULL)",
    );
    return Number(n) === 0 ? ["PASS", "BR-06 satisfied"] : ["FAIL", `${n} published revision(s) with no publisher`];
  });

  await check("denormalised published_at is in sync", async () => {
    const n = await scalar<bigint>(
      `SELECT count(*) FROM articles a JOIN article_revisions r ON r.id = a.current_published_revision_id
        WHERE a.published_at IS DISTINCT FROM r.published_at`,
    );
    return Number(n) === 0 ? ["PASS", "article and revision agree"] : ["FAIL", `${n} out of sync`];
  });

  // --- Hygiene: things that are not wrong yet but get worse on their own ---

  await check("session table hygiene", async () => {
    const dead = Number(
      await scalar<bigint>(
        "SELECT count(*) FROM sessions WHERE expires_at < now() - interval '30 days' OR revoked_at < now() - interval '30 days'",
      ),
    );
    const live = Number(
      await scalar<bigint>("SELECT count(*) FROM sessions WHERE expires_at >= now() AND revoked_at IS NULL"),
    );
    if (dead === 0) return ["PASS", `${live} live session(s), nothing past retention`];
    // The reaper (common/session-reaper.ts) clears these hourly; a pile of
    // them means it is not running.
    return ["WARN", `${dead} session(s) past the 30-day retention — is the reaper running?`];
  });

  await check("no expired password-reset token left outstanding", async () => {
    const n = Number(
      await scalar<bigint>(
        "SELECT count(*) FROM users WHERE password_reset_token_hash IS NOT NULL AND password_reset_expires_at < now()",
      ),
    );
    return n === 0 ? ["PASS", "none"] : ["WARN", `${n} expired token(s) still stored`];
  });

  await check("no orphaned media references", async () => {
    const n = await scalar<bigint>(
      `SELECT count(*) FROM article_revisions r
         LEFT JOIN media_assets m ON m.id = r.featured_image_id
        WHERE r.featured_image_id IS NOT NULL AND m.id IS NULL`,
    );
    return Number(n) === 0 ? ["PASS", "every featured image resolves"] : ["FAIL", `${n} dangling reference(s)`];
  });

  await check("audit trail is present", async () => {
    const n = Number(await scalar<bigint>("SELECT count(*) FROM audit_logs"));
    // Not a failure on a fresh database, but on one with articles it means
    // writes are happening without being recorded (CAP-15).
    const articles = Number(await scalar<bigint>("SELECT count(*) FROM articles"));
    if (articles > 0 && n === 0) return ["FAIL", "articles exist but nothing was audited"];
    return ["PASS", `${n} audit record(s)`];
  });
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const stageArg = process.argv.find((a) => a.startsWith("--stage="))?.split("=")[1] ?? "post";
  if (!["pre", "post", "all"].includes(stageArg)) {
    process.stderr.write(`Unknown stage "${stageArg}" — expected pre, post or all\n`);
    process.exit(2);
  }

  process.stdout.write(`\nDatabase verification — stage: ${stageArg}\n\n`);

  if (stageArg === "pre" || stageArg === "all") await preChecks();
  if (stageArg === "post" || stageArg === "all") await postChecks();

  const MARK: Record<Status, string> = { PASS: "ok  ", WARN: "warn", FAIL: "FAIL", SKIP: "skip" };
  const width = Math.max(...results.map((r) => r.name.length));
  for (const { name, status, detail } of results) {
    process.stdout.write(`  [${MARK[status]}] ${name.padEnd(width)}  ${detail}\n`);
  }

  const failed = results.filter((r) => r.status === "FAIL");
  const warned = results.filter((r) => r.status === "WARN");
  const skipped = results.filter((r) => r.status === "SKIP");
  const passed = results.length - failed.length - warned.length - skipped.length;

  process.stdout.write(
    `\n${results.length} checks — ${passed} passed, ${warned.length} warning(s), ` +
      `${failed.length} failure(s)${skipped.length > 0 ? `, ${skipped.length} skipped` : ""}\n`,
  );
  if (unreachable) {
    // Without this the report reads like the schema is in ruins, when the
    // truth is that one connection dropped and nothing else was examined.
    process.stdout.write(
      "\nThe database became unreachable part-way through, so the checks after the\n" +
        "first failure did not run. Nothing below it has been verified either way.\n",
    );
  }
  process.stdout.write("\n");

  // GitHub gates Actions logs behind a signed-in session; annotations are
  // public. Emitting the failures as one makes a red run diagnosable from
  // the API, which is how the checks themselves get fixed.
  if (failed.length > 0 && process.env.GITHUB_ACTIONS === "true") {
    const summary = failed.map((r) => `${r.name}: ${r.detail}`).join(" ~ ").slice(0, 3000);
    process.stdout.write(`::error title=db:verify failed::${summary}
`);
  }

  await prisma.$disconnect();
  process.exit(failed.length > 0 ? 1 : 0);
}

void main().catch(async (error: unknown) => {
  // A throw out here means the database could not be reached at all, which
  // is itself the answer the caller needs — as a failure, not a stack.
  process.stderr.write(`\nVerification could not run: ${error instanceof Error ? error.message : String(error)}\n\n`);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
