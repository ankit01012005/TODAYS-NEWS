import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public API returns image URLs as relative paths (`/uploads/...`) —
  // correct for a same-origin CDN/object-storage setup (docs/23 §3.2:
  // "images served directly"), but Phase 4C-3's storage is a local-disk
  // placeholder served BY the Express backend itself, on a different
  // origin/port than this app in dev. This rewrite makes the relative URL
  // the backend returns resolve correctly without the backend needing to
  // know its own public origin, and without CORS. Revisit once real
  // object storage + a CDN exist — at that point the backend should return
  // fully-qualified CDN URLs and this rewrite goes away.
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error("API_BASE_URL is not set — copy .env.example to .env.local");
    }
    return [{ source: "/uploads/:path*", destination: `${apiBaseUrl}/uploads/:path*` }];
  },
};

export default nextConfig;
