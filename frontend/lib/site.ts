/// Publication-level constants shared by the masthead, footer, metadata,
/// the PR & Distribution page, the ANVAY TV hub and date formatting.
///
/// Everything in this file is hand-maintained site configuration — none of
/// it is in the database (design handoff "Gaps" 2: reach figures, PR
/// contact, handles and bulletins are config, not an entity). Replace the
/// placeholder values before the public sees them (docs/27 E1).
export const SITE_NAME = "ANVAY TV";
export const SITE_SHORT_NAME = "ANVAY";
export const SITE_TAGLINE = "We report from where it happens.";
export const SITE_CITY = "Kolkata";
export const SITE_TIMEZONE = process.env.SITE_TIMEZONE || "Asia/Kolkata";
export const SITE_LOCALE = "en-GB";

/// Average adult reading speed used for the article page's reading-time
/// estimate. Deliberately conservative.
export const WORDS_PER_MINUTE = 220;

/// Where the newsroom's stories land. The "Our handles" bar, the footer,
/// the PR page and the article share bar all read from here, so a handle
/// changes in exactly one place. `reach` is shown on the PR page as a
/// display string ("120K"); null renders as "—" until the real figure is
/// supplied.
export type HandleKey = "instagram" | "x" | "youtube" | "whatsapp";

export interface SocialHandle {
  key: HandleKey;
  label: string;
  handle: string;
  url: string;
  reach: string | null;
  reachLabel: string;
}

export const SOCIAL_HANDLES: SocialHandle[] = [
  {
    key: "instagram",
    label: "Instagram",
    handle: "@anvaytv",
    url: "https://www.instagram.com/anvaytv",
    reach: null,
    reachLabel: "followers",
  },
  {
    key: "x",
    label: "X",
    handle: "@anvaytv",
    url: "https://x.com/anvaytv",
    reach: null,
    reachLabel: "followers",
  },
  {
    key: "youtube",
    label: "YouTube",
    handle: "@anvaytv",
    url: "https://www.youtube.com/@anvaytv",
    reach: null,
    reachLabel: "subscribers",
  },
  {
    key: "whatsapp",
    label: "WhatsApp channel",
    handle: "ANVAY TV",
    url: "https://whatsapp.com/channel/anvaytv",
    reach: null,
    reachLabel: "channel members",
  },
];

/// Contact addresses — the Contact page's four ways in, and the PR desk.
/// The public site is read-only: every form on it composes an email
/// rather than posting anywhere (design handoff "Gaps" 3).
export const CONTACTS = {
  tips: "tips@anvaytv.example",
  corrections: "corrections@anvaytv.example",
  careers: "careers@anvaytv.example",
  press: "press@anvaytv.example",
  privacy: "privacy@anvaytv.example",
  general: "hello@anvaytv.example",
};

/// The ANVAY TV hub (/tv). Video lives on the handles, not in stories —
/// the body validator has no video block (design handoff "Gaps" 1) — so
/// this page lists YouTube embeds from config. Leave `liveVideoId` null
/// when nothing is live; `nextBulletin` is shown in its place.
export interface Bulletin {
  videoId: string;
  title: string;
  date: string; // ISO date
  durationMinutes: number;
}

export interface ShortClip {
  videoId: string;
  title: string;
}

export const TV_CONFIG: {
  channelUrl: string;
  liveVideoId: string | null;
  nextBulletin: string;
  latest: Bulletin | null;
  shorts: ShortClip[];
  bulletins: Bulletin[];
} = {
  channelUrl: "https://www.youtube.com/@anvaytv",
  liveVideoId: null,
  nextBulletin: "6pm IST",
  latest: null,
  shorts: [],
  bulletins: [],
};

/// PR & Distribution copy that is likely to change with the newsroom's
/// commercial terms, kept out of the page component.
export const PR_CONFIG = {
  pressContact: CONTACTS.press,
  syndicationNote:
    "Partners may republish our reporting with attribution and a link back to the original story. Photography carries its own credit and is licensed separately.",
};
