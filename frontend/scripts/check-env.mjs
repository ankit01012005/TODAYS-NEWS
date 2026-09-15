// Fails a deploy before it starts if the runtime configuration is wrong.
//
//   npm run check:env
//
// The accessors in lib/env.ts validate on first use, which means a bad
// SITE_URL surfaces on a reader's first request rather than at release
// time. This runs them all up front — in the release pipeline, right after
// the build and before traffic is switched over.
//
// It reads lib/env.ts's rules by re-implementing none of them: the file is
// TypeScript, so the checks are duplicated here in the small number of
// cases that matter. Keep the two in step — there is a test that they
// agree (see the note in lib/env.ts).
const isProduction = (process.env.NODE_ENV ?? "production") === "production";
const problems = [];

function origin(name, { httpsInProduction = false } = {}) {
  const raw = process.env[name]?.trim();
  if (!raw) {
    problems.push(`${name} is not set.`);
    return null;
  }
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    problems.push(`${name} is not a valid URL: "${raw}"`);
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    problems.push(`${name} must be http:// or https:// — got "${raw}"`);
    return null;
  }
  if (httpsInProduction && isProduction && parsed.protocol !== "https:") {
    problems.push(`${name} must be https in production — got "${raw}"`);
  }
  return parsed;
}

const site = origin("SITE_URL", { httpsInProduction: true });
const api = origin("API_BASE_URL");

const secret = process.env.REVALIDATE_SECRET?.trim();
if (!secret && isProduction) {
  problems.push(
    "REVALIDATE_SECRET is not set — the API cannot purge the public cache, so a withdrawn " +
      "story would stay visible until the 60-second window expires (docs/27 B3).",
  );
} else if (secret && secret.length < 32) {
  problems.push("REVALIDATE_SECRET must be at least 32 characters.");
}

// The mistake this exists for: SITE_URL left pointing at a development
// port while the app serves on another, which publishes a sitemap, a feed
// and every canonical tag addressed to a host nothing answers on.
if (site && isProduction && /localhost|127\.0\.0\.1/.test(site.hostname)) {
  problems.push(`SITE_URL points at ${site.hostname} in a production build.`);
}
if (api && isProduction && api.protocol === "http:" && !/localhost|127\.0\.0\.1/.test(api.hostname)) {
  problems.push(`API_BASE_URL is plain http to a remote host (${api.host}) — session cookies would cross the network in the clear.`);
}

if (problems.length > 0) {
  process.stderr.write(`\nConfiguration is not deployable:\n${problems.map((p) => `  - ${p}`).join("\n")}\n\n`);
  process.exit(1);
}

process.stdout.write(
  `\nConfiguration OK\n  SITE_URL          ${site?.origin}\n  API_BASE_URL      ${api?.origin}\n` +
    `  REVALIDATE_SECRET ${secret ? "set" : "not set (cache purging disabled)"}\n\n`,
);
