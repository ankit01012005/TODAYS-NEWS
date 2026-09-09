import { Newsreader, Inter, IBM_Plex_Mono } from "next/font/google";

/// docs/19 §1.2 — two families for the interface/editorial split, plus one
/// used in exactly one place (timestamps/reference IDs). Weights limited to
/// 400/600 per §1.2 rule 3 ("only two weights per family in V1").
export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
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
