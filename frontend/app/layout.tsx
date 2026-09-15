import type { Metadata } from "next";
import { archivo, ibmPlexMono } from "./fonts";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { ToastProvider } from "@/components/cms/Toast";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { siteUrl } from "@/lib/env";
import "./globals.css";

function metadataBaseUrl(): URL | undefined {
  try {
    return new URL(siteUrl());
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  // Resolved through the validated accessor so a malformed SITE_URL is
  // caught here too, but tolerated if it is absent: metadata is evaluated
  // during `next build`, which must not require the runtime environment
  // (docs/27 A6). `npm run check:env` is what refuses a bad deploy.
  metadataBase: metadataBaseUrl(),
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
