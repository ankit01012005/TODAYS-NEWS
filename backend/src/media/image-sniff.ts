/// SEC-10 — type must be checked by content (magic bytes), never by file
/// extension or the client-supplied Content-Type header. Deliberately no
/// re-encoding step here (that needs an image-processing library, e.g.
/// sharp) — a disclosed gap alongside the local-disk storage placeholder;
/// re-encoding to strip embedded payloads/EXIF is real infrastructure for
/// a later pass, not this one.
const SIGNATURES: { mimeType: string; extension: string; matches: (buf: Buffer) => boolean }[] = [
  {
    mimeType: "image/jpeg",
    extension: "jpg",
    matches: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    mimeType: "image/png",
    extension: "png",
    matches: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a,
  },
  {
    mimeType: "image/gif",
    extension: "gif",
    matches: (buf) => buf.length >= 4 && buf.toString("ascii", 0, 4) === "GIF8",
  },
  {
    mimeType: "image/webp",
    extension: "webp",
    matches: (buf) =>
      buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP",
  },
];

export function sniffImageType(buffer: Buffer): { mimeType: string; extension: string } | null {
  for (const sig of SIGNATURES) {
    if (sig.matches(buffer)) return { mimeType: sig.mimeType, extension: sig.extension };
  }
  return null;
}
