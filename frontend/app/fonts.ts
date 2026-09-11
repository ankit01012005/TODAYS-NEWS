import { Newsreader, Inter, IBM_Plex_Mono } from "next/font/google";

/// docs/19 §1.2 — two families for the interface/editorial split, plus one
/// used in exactly one place (timestamps/reference IDs). Weights limited to
/// 400/600 per §1.2 rule 3 ("only two weights per family in V1").
/// Newsreader's optical-size axis is loaded so the hero display sizes get
/// the higher-contrast cut the face was drawn with, not a scaled-up text
/// cut (brief §13 — "typography should do much of the visual work").
/// next/font only allows extra axes on a `variable` weight; that is one
/// file per style covering the range, and the stylesheet still uses only
/// 400 and 600.
export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
