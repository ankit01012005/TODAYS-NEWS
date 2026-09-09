import type { MetadataRoute } from "next";

/// PG-PUB-M2 — SEO-09. Nothing to disallow yet: this app is the public
/// site only, no /staff route exists in it (5C/5D build the CMS as its
/// own separate route tree, not built yet). Revisit once it does — the
/// CMS must never be indexed.
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
