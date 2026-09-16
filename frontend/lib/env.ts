/// Server-side configuration, resolved and shape-checked in one place.
///
/// Server-only by naming, not by the `server-only` package: none of these
/// variables is prefixed NEXT_PUBLIC_*, so Next.js never inlines them into
/// client bundles and every accessor here returns undefined in a browser.
/// That is the same convention the rest of this app uses (lib/api/*).
///
/// Why this file exists: SITE_URL used to be read in four places with three
/// different inline fallbacks. A stale value in .env.local therefore
/// published a sitemap, an RSS feed, a robots.txt and every canonical and
/// OG tag pointing at a port nothing was listening on — a deployment that
/// looks completely healthy while being invisible to search engines and
/// broken in every shared link. Nothing checked, because there was nowhere
/// to check.
///
/// The split of responsibilities matters:
///
///   here            — SHAPE. Is it a URL at all? Trailing slash removed?
///                     Sensible development fallback? Never throws for a
///                     merely unset variable, because `next build`
///                     prerenders routes (robots.txt, and any static page)
///                     without the runtime environment, and the build must
///                     not depend on it (docs/27 A6).
///   check-env.mjs   — POLICY. Is this configuration fit to *deploy*?
///                     https, no localhost, the revalidation secret
///                     present. Run explicitly in the release pipeline,
///                     where failing is the desired outcome.
///
/// Putting the policy here instead broke `next build`, which is exactly the
/// failure mode A6 was written about.

export interface PublicSiteEnv {
  /// This app's own public origin. Absolute URLs in the sitemap, the feed,
  /// robots.txt, canonical tags and share links are built from it.
  ///
  /// Note that robots.txt and the sitemap are prerendered, so the value
  /// present at BUILD time is the one baked into them — it has to be set
  /// for the build, not just for the running container.
  siteUrl: string;
  /// The backend API, server-to-server only. Never NEXT_PUBLIC_* — the
  /// browser must not hold the API's origin (docs/23 §11.4).
  apiBaseUrl: string;
  /// Shared with the backend's REVALIDATE_SECRET; lets the API purge the
  /// public cache on publish (docs/27 B3). Null disables the endpoint.
  revalidateSecret: string | null;
}

const DEV_SITE_URL = "http://localhost:3000";
const DEV_API_BASE_URL = "http://localhost:3001";

/// Parses an origin and normalises it. Throws only on a value that is
/// present but unusable — an unset variable falls back instead, so a build
/// never fails for want of a runtime setting.
function origin(name: string, raw: string | undefined, fallback: string): string {
  const value = raw?.trim();
  if (!value) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a full origin such as https://example.com — got "${value}".`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${name} must be http:// or https:// — got "${value}".`);
  }
  // A trailing slash here becomes a double slash in every URL built from
  // it, which is a different (and often 404ing) address.
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
}

export function siteUrl(): string {
  return origin("SITE_URL", process.env.SITE_URL, DEV_SITE_URL);
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/// Server-only. Never prefixed NEXT_PUBLIC_* — the browser must never talk
/// to the API directly (docs/23 §11.4); every call originates from a
/// server component, server action or route handler.
export function apiBaseUrl(): string {
  return origin("API_BASE_URL", process.env.API_BASE_URL, DEV_API_BASE_URL);
}

/// Null means the revalidation endpoint rejects everything, which is the
/// documented development behaviour (the 60-second window in public.ts is
/// the fallback). check-env.mjs is what refuses to let that reach
/// production, where the backend would not boot without the matching
/// secret anyway.
export function revalidateSecret(): string | null {
  const value = process.env.REVALIDATE_SECRET?.trim();
  if (!value) return null;
  if (value.length < 32) {
    throw new Error("REVALIDATE_SECRET must be at least 32 characters.");
  }
  return value;
}

export function resolvedEnv(): PublicSiteEnv {
  return {
    siteUrl: siteUrl(),
    apiBaseUrl: apiBaseUrl(),
    revalidateSecret: revalidateSecret(),
  };
}
