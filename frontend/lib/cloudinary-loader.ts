import type { ImageLoaderProps } from "next/image";

/// next/image loader (next.config.ts `images.loaderFile`). Every image the
/// API hands out is a Cloudinary URL — the stored master (media/storage.ts
/// bounds it to 2,400 px and re-encodes it on ingest). This turns the
/// master's URL into a delivery URL with Cloudinary's transformations in
/// it, so the CDN, not this server, does the resizing and format work:
///
///   f_auto  — AVIF/WebP/JPEG chosen per browser
///   q_auto  — perceptual quality, usually 40–70 % smaller than the master
///   w_<n>   — exactly the width next/image asked for (its srcset sizes)
///   c_limit — never upscale a small master
///
/// Without this, next/image proxies every request through its own
/// optimiser (/_next/image): it fetches the multi-megabyte master, runs
/// sharp, and caches the result per width — seconds per image in
/// development, and CPU on the web server in production.
///
/// A URL that isn't a Cloudinary upload URL is returned untouched.
const UPLOAD_SEGMENT = "/image/upload/";

export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const at = src.indexOf(UPLOAD_SEGMENT);
  if (!src.startsWith("https://res.cloudinary.com/") || at === -1) return src;

  const q = quality ? `q_${quality}` : "q_auto";
  const transformation = `f_auto,${q},w_${width},c_limit`;
  const head = src.slice(0, at + UPLOAD_SEGMENT.length);
  const tail = src.slice(at + UPLOAD_SEGMENT.length);
  return `${head}${transformation}/${tail}`;
}
