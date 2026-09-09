import type { Metadata } from "next";
import { newsreader, inter, ibmPlexMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Today News",
  description: "Today News — a public news website.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
