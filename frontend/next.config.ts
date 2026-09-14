import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
