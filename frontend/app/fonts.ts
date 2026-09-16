import { Archivo, IBM_Plex_Mono } from "next/font/google";

/// Anvay brand type (design_handoff_anvay_frontend/README.md "Type"):
/// Archivo for everything — 800 for the wordmark and display numerals,
/// 600 for labels, 400–500 for UI and body. The ANVAY TV lockup the client
/// chose is a geometric sans, so the whole site speaks the same voice. The
/// variable cut is one file for every weight used.
export const archivo = Archivo({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-archivo",
  display: "swap",
});

/// IBM Plex Mono 400 — timestamps, version numbers, addresses, the audit
/// log. The one place a second family is allowed.
export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
