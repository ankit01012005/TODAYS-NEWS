/// The app's own public origin, server-side (SITE_URL, the same value the
/// sitemap and feed use). For building absolute story links — share
/// sheets, WhatsApp, "copy caption" — where the browser's origin isn't
/// known at render time.
export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
