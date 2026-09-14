import type { MetadataRoute } from "next";

/// SEO-09 — the CMS and the proxy must never be indexed. The public site
/// is everything else.
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/staff", "/api", "/search"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
