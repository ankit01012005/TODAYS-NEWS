// Post-deploy smoke check — the last gate in the release pipeline
// (docs/27 B2, step 10).
//
//   node scripts/smoke.mjs --api=https://api.example.com --site=https://example.com
//
// Exit 0 = the release is serving. Exit 1 = roll back.
//
// What it deliberately checks, beyond "did it return 200":
//   - /ready separately from /health, because a process that is alive but
//     cannot reach its database is the failure a naive check misses.
//   - that a public page actually contains content, not just a 200 shell.
//   - that absolute URLs in robots.txt and the sitemap match the site
//     being deployed. A SITE_URL left at a development value is invisible
//     in every other check and breaks every shared link and search result.
//   - that /staff is NOT served to an anonymous caller, so a broken auth
//     guard cannot reach production quietly.
//
// Read-only and unauthenticated: safe to run against production on every
// deploy, and it creates nothing that would need cleaning up.

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.join("=")];
  }),
);

const api = (args.api ?? process.env.API_BASE_URL ?? "http://localhost:3001").replace(/\/+$/, "");
const site = (args.site ?? process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const timeoutMs = Number(args.timeout ?? 15000);

const results = [];

async function get(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "manual",
    headers: { "user-agent": "today-news-smoke/1" },
  });
  return { status: res.status, body: await res.text().catch(() => "") };
}

async function check(name, run) {
  try {
    const [ok, detail] = await run();
    results.push({ name, ok, detail });
  } catch (error) {
    results.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
}

await check("API /health", async () => {
  const { status, body } = await get(`${api}/health`);
  return [status === 200 && body.includes('"ok"'), `${status} ${body.slice(0, 60)}`];
});

await check("API /ready (database reachable)", async () => {
  const { status, body } = await get(`${api}/ready`);
  // 503 here is the honest answer from a process whose database is down —
  // and a reason not to send traffic to this release.
  return [status === 200, `${status} ${body.slice(0, 60)}`];
});

await check("API public article list", async () => {
  const { status, body } = await get(`${api}/public/articles`);
  if (status !== 200) return [false, `${status}`];
  const parsed = JSON.parse(body);
  return [Array.isArray(parsed.articles), `${parsed.articles?.length ?? "?"} article(s)`];
});

await check("API rejects an unauthenticated CMS read", async () => {
  const { status } = await get(`${api}/articles`);
  return [status === 401, `${status} (expected 401)`];
});

await check("Site home page renders", async () => {
  const { status, body } = await get(`${site}/`);
  // A 200 with an empty shell is a broken deploy that a status-only check
  // would pass.
  return [status === 200 && body.length > 2000, `${status}, ${body.length} bytes`];
});

await check("Site robots.txt points at this deployment", async () => {
  const { status, body } = await get(`${site}/robots.txt`);
  if (status !== 200) return [false, `${status}`];
  const sitemapLine = body.split("\n").find((l) => l.toLowerCase().startsWith("sitemap:")) ?? "";
  return [sitemapLine.includes(site), sitemapLine.trim() || "no Sitemap: line"];
});

await check("Site sitemap uses the deployed origin", async () => {
  const { status, body } = await get(`${site}/sitemap.xml`);
  if (status !== 200) return [false, `${status}`];
  const first = body.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
  return [first.startsWith(site), first || "no <loc> entries"];
});

await check("Site RSS feed is well-formed", async () => {
  const { status, body } = await get(`${site}/feed.xml`);
  return [status === 200 && body.startsWith("<?xml") && body.includes("<rss"), `${status}`];
});

await check("CMS is not served to anonymous callers", async () => {
  const { status, body } = await get(`${site}/staff/users`);
  // Next renders a redirect shell rather than a 3xx for these; either is
  // correct, a page containing staff data is not.
  const redirected = status >= 300 && status < 400;
  const shell = status === 200 && body.includes("/staff/sign-in");
  return [redirected || shell, `${status}${shell ? " (redirect shell)" : ""}`];
});

const width = Math.max(...results.map((r) => r.name.length));
process.stdout.write(`\nSmoke check\n  api  ${api}\n  site ${site}\n\n`);
for (const { name, ok, detail } of results) {
  process.stdout.write(`  [${ok ? "ok  " : "FAIL"}] ${name.padEnd(width)}  ${detail}\n`);
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(`\n${results.length} checks — ${results.length - failed.length} passed, ${failed.length} failed\n\n`);
process.exit(failed.length > 0 ? 1 : 0);
