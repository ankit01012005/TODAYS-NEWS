import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { noStoreHeaders, securityHeaders } from "./lib/security-headers";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Names the framework and version to anyone probing the site; costs
  // nothing to remove.
  poweredByHeader: false,

  // Every browser-facing protection this app was missing — see
  // lib/security-headers.ts for what each one is for.
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders() },
      // The CMS and the write proxy on top of that: never stored.
      { source: "/staff/:path*", headers: noStoreHeaders() },
      { source: "/api/backend/:path*", headers: noStoreHeaders() },
    ];
  },

  // Emits .next/standalone with a minimal server.js and only the
  // node_modules actually reached at runtime, so the deployed image does
  // not carry the build toolchain or the full dependency tree. `public`
  // and `.next/static` are copied in alongside it by the Dockerfile —
  // standalone deliberately leaves those out, expecting a CDN.
  //
  // Not on Vercel, which builds its own serverless output and does its own
  // file tracing. Vercel's builder strips `output: "standalone"` from the
  // config before the build — but a Turbopack production build writes
  // .next/next-server.js.nft.json only *when that option is set*, and
  // Vercel's own onBuildComplete step then fails reading a file nothing
  // wrote: ENOENT ... '/vercel/path0/frontend/.next/next-server.js.nft.json'
  // (next.js#96646, Next 16.3.x). Gating it is more than the workaround:
  // standalone is a self-hosting mode, and Vercel never wanted it. Docker
  // and CI set no VERCEL variable, so both still get the standalone build
  // the Dockerfile copies out of .next/standalone.
  output: process.env.VERCEL ? undefined : "standalone",
  // Turbopack infers the workspace root by walking up for a lockfile, and
  // a stray package-lock.json in a parent directory (Desktop, in one real
  // case) made it pick a root outside the repository — which it warns
  // about on every build and which changes what it watches and resolves.
  // Pinning it to this directory makes the build independent of whatever
  // happens to sit above the checkout.
  turbopack: {
    root: projectRoot,
  },
  images: {
    // Every image the API returns is a Cloudinary CDN URL (backend
    // media/storage.ts); nothing else is ever rendered through next/image.
    // The custom loader (lib/cloudinary-loader.ts) hands resizing and
    // format negotiation to Cloudinary's CDN instead of /_next/image.
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
