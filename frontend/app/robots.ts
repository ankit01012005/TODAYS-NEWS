import type { MetadataRoute } from "next";
import { siteUrl as resolveSiteUrl } from "@/lib/env";

/// SEO-09 — the CMS and the proxy must never be indexed. The public site
/// is everything else.
export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/staff", "/api", "/search"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
