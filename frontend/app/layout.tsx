import type { Metadata } from "next";
import { newsreader, inter, ibmPlexMono } from "./fonts";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
  title: SITE_NAME,
  description: `${SITE_NAME} — reporting across every desk, reviewed by an editor before it is published.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body id="top">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-space-3 focus:left-space-3 focus:z-(--z-overlay) focus:rounded-sm focus:bg-ink focus:px-space-4 focus:py-space-2 focus:text-body-sm focus:text-paper"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
