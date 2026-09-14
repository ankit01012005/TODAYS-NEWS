import type { Metadata } from "next";
import { archivo, ibmPlexMono } from "./fonts";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { ToastProvider } from "@/components/cms/Toast";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: `${SITE_NAME} — ${SITE_TAGLINE} Every story is reviewed by an editor before it is published.`,
  applicationName: SITE_NAME,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable}`}>
      <body id="top">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-space-3 focus:left-space-3 focus:z-(--z-overlay) focus:bg-ink focus:px-space-4 focus:py-space-2 focus:text-body-sm focus:text-bone"
        >
          Skip to content
        </a>
        <MotionProvider>
          {/* Above every route so a toast raised just before a navigation
              (sign-in, set-password, submit) survives it. Renders nothing
              until something calls useToast(). */}
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
