import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Every image the API returns is a Cloudinary CDN URL (backend
    // media/storage.ts); nothing else is ever rendered through next/image.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
