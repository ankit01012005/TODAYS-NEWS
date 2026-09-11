import type { SocialPlatform } from "./api/public-types";

/// A short, honest label for where a link goes — derived from the host,
/// so it needs no field on the source. Unknown hosts read as the host.
export function platformLabel(url: string): string {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "Link";
  }
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".twitter.com")) return "X";
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "Instagram";
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "YouTube";
  if (host === "facebook.com" || host.endsWith(".facebook.com")) return "Facebook";
  if (host === "threads.net" || host.endsWith(".threads.net")) return "Threads";
  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) return "LinkedIn";
  return host;
}

export const SOCIAL_PLATFORM_LABEL: Record<SocialPlatform, string> = {
  INSTAGRAM: "Instagram",
  X: "X",
  OTHER: "Elsewhere",
};
