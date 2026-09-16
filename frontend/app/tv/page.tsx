import type { Metadata } from "next";
import { ViewTransition } from "react";
import { ExternalLink, Play } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicSite } from "@/components/layout/PublicSite";
import { HandlesBar } from "@/components/layout/HandlesBar";
import { SocialGlyph } from "@/components/brand/SocialGlyph";
import { PulseLine } from "@/components/brand/PulseLine";
import { Spotlight } from "@/components/motion/Spotlight";
import { TextReveal } from "@/components/motion/TextReveal";
import { formatPublicDateShort } from "@/lib/format-date";
import { SITE_NAME, TV_CONFIG } from "@/lib/site";

export const metadata: Metadata = {
  title: "ANVAY TV",
  description: `${SITE_NAME} bulletins and shorts — live when we are, and on the channel the rest of the time.`,
};

/// 2g — the ANVAY TV hub. Video lives on the handles rather than inside
/// stories (the body validator has no video block), so this page is
/// config-driven: a live player or the newest bulletin, a shorts rail,
/// and the full bulletins list, all YouTube embeds from lib/site.ts.
/// Until the config is filled in it says so honestly and points at the
/// channel — never an empty player.
export default async function TvPage() {
  const { liveVideoId, latest, nextBulletin, shorts, bulletins, channelUrl } = TV_CONFIG;
  const isLive = liveVideoId !== null;
  const playerId = liveVideoId ?? latest?.videoId ?? null;

  return (
    <PublicSite>
      <PublicHeader showPulse={false} activePath="/tv" />
      <ViewTransition default="page-fade">
        <main id="content">
          <Spotlight className="band-dark">
            <section className="mx-auto max-w-(--width-page-max) px-space-4 py-space-6 md:px-space-6 md:py-space-7">
              <div className="flex flex-wrap items-center gap-x-space-3 gap-y-space-2">
                <span
                  className={`inline-flex h-7 items-center gap-x-space-2 rounded-pill border px-space-3 text-label ${
                    isLive ? "border-brand text-brand" : "border-bone/35 text-bone/80"
                  }`}
                >
                  {isLive ? (
                    <span className="live-dot live-dot-sm live-dot-red" aria-hidden="true" />
                  ) : (
                    <span className="h-[6px] w-[6px] rounded-pill bg-bone/50" aria-hidden="true" />
                  )}
                  {isLive ? "Live now" : "Off air"}
                </span>
                {!isLive ? <span className="text-mono text-bone/60">next bulletin {nextBulletin}</span> : null}
              </div>

              <div className="mt-space-4 grid grid-cols-1 gap-x-space-7 gap-y-space-5 md:grid-cols-[minmax(0,1fr)_320px] md:items-end">
                <div>
                  {playerId ? (
                    <div className="relative aspect-16/9 overflow-hidden border border-bone/20 bg-[#0C0E14]">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(playerId)}?rel=0&modestbranding=1`}
                        title={isLive ? `${SITE_NAME} live` : (latest?.title ?? `${SITE_NAME} bulletin`)}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                        className="absolute inset-0 h-full w-full"
                      />
                    </div>
                  ) : (
                    <a
                      href={channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative grid aspect-16/9 place-items-center overflow-hidden border border-bone/20 bg-[#0C0E14] no-underline"
                    >
                      <span className="flex flex-col items-center gap-y-space-3 text-center">
                        <span className="play-ring grid h-14 w-14 place-items-center rounded-pill bg-brand text-paper transition-transform duration-(--duration-base) group-hover:scale-105">
                          <Play size={22} fill="currentColor" aria-hidden="true" />
                        </span>
                        <span className="text-heading-4 text-bone">Bulletins land on YouTube first</span>
                        <span className="text-caption text-bone/60">Open the channel ↗</span>
                      </span>
                      <PulseLine width={180} color="var(--color-brand)" className="absolute bottom-space-5 left-1/2 -translate-x-1/2 opacity-70" beat />
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-label-lg text-gold">ANVAY TV</p>
                  <TextReveal
                    as="h1"
                    text={isLive ? "We’re on air." : (latest?.title ?? "The pulse, on camera.")}
                    className="mt-space-2 text-display-2 text-bone"
                  />
                  <p className="mt-space-3 text-body text-bone/70">
                    {isLive
                      ? "The bulletin is live now. It stays on the channel afterwards."
                      : latest
                        ? `${formatPublicDateShort(latest.date)} · ${latest.durationMinutes} min`
                        : "Short reports from where it happens, and a full bulletin every evening. Follow the channel and the handles to be told the moment we go live."}
                  </p>
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-space-4 inline-flex h-10 items-center gap-x-space-2 border border-bone/40 px-space-4 text-body-sm text-bone no-underline transition-colors hover:border-gold hover:text-gold"
                  >
                    <SocialGlyph platform="youtube" size={15} />
                    Subscribe on YouTube
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </section>
          </Spotlight>

          <div className="mx-auto max-w-(--width-page-max) px-space-4 md:px-space-6">
            <section aria-labelledby="shorts-heading" className="pt-space-7">
              <h2 id="shorts-heading" className="border-b-2 border-brand pb-space-2 text-label-lg text-ink">
                Shorts
              </h2>
              {shorts.length > 0 ? (
                <ul className="no-scrollbar mt-space-4 flex gap-x-space-3 overflow-x-auto pb-space-2">
                  {shorts.map((clip) => (
                    <li key={clip.videoId} className="w-[132px] shrink-0">
                      <a
                        href={`https://www.youtube.com/shorts/${encodeURIComponent(clip.videoId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block no-underline"
                      >
                        <span className="relative block aspect-9/16 overflow-hidden bg-ink">
                          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail, not a Cloudinary asset */}
                          <img
                            src={`https://i.ytimg.com/vi/${encodeURIComponent(clip.videoId)}/hqdefault.jpg`}
                            alt=""
                            loading="lazy"
                            className="img-zoom h-full w-full object-cover"
                          />
                          <span className="absolute inset-x-0 bottom-0 surface-scrim p-space-2 pt-space-6">
                            <span className="line-clamp-2 text-caption font-medium text-bone">{clip.title}</span>
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-space-3 text-body-sm text-ink-muted">Shorts are posted on the handles — nothing is listed here yet.</p>
              )}
            </section>

            <section aria-labelledby="bulletins-heading" className="mt-space-7">
              <h2 id="bulletins-heading" className="border-b-2 border-ink pb-space-2 text-label-lg text-ink">
                Full bulletins
              </h2>
              {bulletins.length > 0 ? (
                <ol className="mt-space-2 divide-y divide-rule">
                  {bulletins.map((bulletin) => (
                    <li key={bulletin.videoId}>
                      <a
                        href={`https://www.youtube.com/watch?v=${encodeURIComponent(bulletin.videoId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-x-space-4 py-space-3 no-underline"
                      >
                        <span className="relative block aspect-16/9 w-[112px] shrink-0 overflow-hidden bg-ink">
                          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail, not a Cloudinary asset */}
                          <img
                            src={`https://i.ytimg.com/vi/${encodeURIComponent(bulletin.videoId)}/mqdefault.jpg`}
                            alt=""
                            loading="lazy"
                            className="img-zoom h-full w-full object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-heading-4 text-ink">
                            <span className="link-underline">{bulletin.title}</span>
                          </span>
                          <span className="mt-space-1 block text-mono-sm text-ink-muted">
                            {formatPublicDateShort(bulletin.date)} · {bulletin.durationMinutes} min
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-space-3 text-body-sm text-ink-muted">
                  Every evening’s bulletin is on the channel. Once the list is maintained here it will appear in this space.
                </p>
              )}
            </section>
          </div>

          <div className="mt-space-8">
            <HandlesBar />
          </div>
        </main>
      </ViewTransition>
      <PublicFooter />
    </PublicSite>
  );
}
