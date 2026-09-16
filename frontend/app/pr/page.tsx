import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ViewTransition } from "react";
import { Download, Palette, Rss } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";
import { PulseLine } from "@/components/brand/PulseLine";
import { SocialGlyph } from "@/components/brand/SocialGlyph";
import { MailForm } from "@/components/public/MailForm";
import { Spotlight } from "@/components/motion/Spotlight";
import { TextReveal } from "@/components/motion/TextReveal";
import { CONTACTS, PR_CONFIG, SITE_NAME, SOCIAL_HANDLES } from "@/lib/site";

export const metadata: Metadata = {
  title: "PR & Distribution",
  description: `Where ${SITE_NAME}'s stories land, how to republish them, and how to pitch the desk.`,
};

const PALETTE = [
  { name: "Sindoor Red", hex: "#C81E1E" },
  { name: "Indigo Black", hex: "#12141C" },
  { name: "Haldi Gold", hex: "#E8A33D" },
  { name: "Bone", hex: "#F4F2EE" },
  { name: "Slate", hex: "#5F6672" },
  { name: "Fresh Green", hex: "#1F8A5B" },
];

/// 1f — the new PR & Distribution page: a dark hero, "Where our stories
/// land" (four reach cards from site config), syndication copy, the
/// press kit (logos and palette, served from /public/brand), the RSS
/// feed, and a pitch form that composes an email to the PR desk.
export default async function PrPage() {
  return (
    <PublicSite>
      <PublicHeader showPulse={false} activePath="/pr" />
      <ViewTransition default="page-fade">
        <main id="content">
          <Spotlight className="band-dark">
            <section className="mx-auto max-w-(--width-page-max) px-space-4 py-space-8 md:px-space-6 md:py-space-9">
              <p className="text-label-lg text-gold">PR &amp; Distribution</p>
              <TextReveal as="h1" text="A newsroom built to travel." className="mt-space-3 max-w-[18ch] text-display-0 text-bone" />
              <p className="mt-space-4 max-w-[58ch] text-standfirst text-bone/75">
                We publish on the site, on the feed and on the handles where most people first meet a story. If you
                want our reporting to reach further — or want to reach us — this is the page.
              </p>
              <PulseLine width={220} color="var(--color-brand)" draw className="mt-space-6" />
            </section>
          </Spotlight>

          <div className="mx-auto max-w-(--width-page-max) px-space-4 md:px-space-6">
            <section aria-labelledby="reach-heading" className="pt-space-7">
              <h2 id="reach-heading" className="text-label-lg text-ink">
                Where our stories land
              </h2>
              <ul className="reveal-stagger mt-space-4 grid grid-cols-2 gap-space-3 md:grid-cols-4">
                {SOCIAL_HANDLES.map((handle) => (
                  <li key={handle.key} className="reveal">
                    <a
                      href={handle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block border border-rule-strong bg-paper p-space-4 no-underline transition-colors duration-(--duration-fast) hover:border-ink"
                    >
                      <span className="flex items-center gap-x-space-2 text-caption text-ink-muted">
                        <SocialGlyph platform={handle.key} size={13} />
                        {handle.label}
                      </span>
                      <span className="mt-space-2 block text-numeral-sm text-ink">{handle.reach ?? "—"}</span>
                      <span className="mt-space-1 block text-caption text-ink-muted">{handle.reachLabel}</span>
                      <span className="mt-space-3 block text-mono-sm text-ink-secondary">{handle.handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="syndication-heading" className="mt-space-7 border-t border-rule pt-space-5">
              <h2 id="syndication-heading" className="text-label-lg text-ink">
                Syndication &amp; republishing
              </h2>
              <p className="mt-space-3 max-w-[64ch] text-body text-ink-secondary">{PR_CONFIG.syndicationNote}</p>
              <p className="mt-space-2 max-w-[64ch] text-body text-ink-secondary">
                Every story has a permanent address that never changes once it is published, so a link you place
                today still works next year. For anything beyond attribution and a link, write to{" "}
                <a href={`mailto:${PR_CONFIG.pressContact}`} className="text-ink underline decoration-brand/60 underline-offset-4">
                  {PR_CONFIG.pressContact}
                </a>
                .
              </p>
              <div className="mt-space-4 flex flex-wrap gap-space-2">
                <a
                  href="#press-kit"
                  className="inline-flex h-10 items-center gap-x-space-2 bg-brand px-space-4 text-body-sm font-medium text-paper no-underline transition-colors hover:bg-brand-deep"
                >
                  <Download size={14} aria-hidden="true" />
                  Press kit
                </a>
                <a
                  href="#palette"
                  className="inline-flex h-10 items-center gap-x-space-2 border border-ink bg-paper px-space-4 text-body-sm text-ink no-underline transition-colors hover:bg-ink hover:text-paper"
                >
                  <Palette size={14} aria-hidden="true" />
                  Logos &amp; palette
                </a>
                <Link
                  href="/feed.xml"
                  className="inline-flex h-10 items-center gap-x-space-2 border border-ink bg-paper px-space-4 text-body-sm text-ink no-underline transition-colors hover:bg-ink hover:text-paper"
                >
                  <Rss size={14} aria-hidden="true" />
                  RSS feed
                </Link>
              </div>
            </section>

            <section id="press-kit" aria-labelledby="kit-heading" className="mt-space-7 scroll-mt-24 border-t border-rule pt-space-5">
              <h2 id="kit-heading" className="text-label-lg text-ink">
                Press kit
              </h2>
              <p className="mt-space-3 max-w-[64ch] text-body text-ink-secondary">
                The wordmark in SVG for light and dark backgrounds, the monogram for avatars and app icons, and the
                palette. Keep the pulse line intact and give the mark room to breathe — never recolour the red.
              </p>
              <ul className="mt-space-4 grid grid-cols-1 gap-space-3 sm:grid-cols-3">
                {[
                  { file: "anvay-tv.svg", label: "Wordmark — on light", dark: false },
                  { file: "anvay-tv-on-dark.svg", label: "Wordmark — on dark", dark: true },
                  { file: "anvay-monogram.svg", label: "Monogram", dark: false },
                ].map((asset) => (
                  <li key={asset.file}>
                    <a
                      href={`/brand/${asset.file}`}
                      download
                      className={`group block border border-rule-strong no-underline transition-colors hover:border-ink ${asset.dark ? "bg-ink" : "bg-paper"}`}
                    >
                      <span className="relative block aspect-3/1">
                        <Image src={`/brand/${asset.file}`} alt={asset.label} fill unoptimized className="object-contain p-space-4" />
                      </span>
                      <span className="flex items-center justify-between border-t border-rule px-space-3 py-space-2 text-caption text-ink-muted">
                        <span className={asset.dark ? "text-bone/80" : ""}>{asset.label}</span>
                        <span className="inline-flex items-center gap-x-space-1 text-mono-sm">
                          SVG <Download size={11} aria-hidden="true" />
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <div id="palette" className="mt-space-5 scroll-mt-24">
                <p className="text-label text-ink-muted">Palette</p>
                <ul className="mt-space-3 grid grid-cols-3 gap-space-2 sm:grid-cols-6">
                  {PALETTE.map((swatch) => (
                    <li key={swatch.hex} className="border border-rule bg-paper">
                      <span className="block aspect-4/3" style={{ backgroundColor: swatch.hex }} />
                      <span className="block px-space-2 py-space-2">
                        <span className="block text-caption text-ink">{swatch.name}</span>
                        <span className="block text-mono-sm text-ink-muted">{swatch.hex}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <a href="/brand/palette.json" download className="mt-space-3 inline-block text-mono-sm text-ink-secondary underline decoration-brand/60 underline-offset-4">
                  palette.json
                </a>
              </div>
            </section>

            <section aria-labelledby="pitch-heading" className="mt-space-7 border-t border-rule pt-space-5">
              <h2 id="pitch-heading" className="sr-only">
                Pitch the desk
              </h2>
              <MailForm
                heading="Pitch us / PR desk"
                to={CONTACTS.press}
                subjectPrefix="Pitch for ANVAY TV"
                fields={[
                  { name: "name", label: "Name", required: true },
                  { name: "email", label: "Email", type: "email", required: true },
                  { name: "story", label: "What’s the story?", type: "textarea", required: true },
                ]}
                submitLabel="Send"
              />
            </section>
          </div>
        </main>
      </ViewTransition>
      <PublicFooter />
    </PublicSite>
  );
}
