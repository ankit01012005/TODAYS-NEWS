import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/public/StaticPage";
import { Avatar } from "@/components/public/Avatar";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

/// 2b — who we are. Two columns of copy, "THE DESK" (hand-maintained:
/// staff photos are not in the database), and three routes onward.
/// Replace the desk entries with real people before launch.
const DESK: { name: string; role: string }[] = [
  { name: "Aniket Mandal", role: "Editor-in-chief" },
  { name: "Ankit Kumar", role: "Reporter" },
];

export default async function AboutPage() {
  return (
    <StaticPage kicker={`About ${SITE_NAME}`} title={SITE_TAGLINE} activePath="/about">
      <p>
        {SITE_NAME} is an independent newsroom. We go to where the story is, talk to the people it
        happens to, and publish only what we can stand behind — on this site, and on the handles
        where most of our readers first find us.
      </p>
      <div className="grid grid-cols-1 gap-x-space-6 gap-y-space-5 sm:grid-cols-2">
        <div>
          <h2 className="!mt-0">Reported, then reviewed</h2>
          <p className="mt-space-2 text-body">
            Every story is written by a member of our staff and approved by a second person before
            it goes live. Nothing is published automatically, and no one both writes and approves
            the same story.
          </p>
        </div>
        <div>
          <h2 className="!mt-0">Built to travel</h2>
          <p className="mt-space-2 text-body">
            A story is not finished when it is published — it is finished when it reaches people.
            We write for the site, for the feed and for the screen in your hand, and we say where
            our sources came from.
          </p>
        </div>
      </div>

      <section className="border-t border-rule pt-space-5">
        <h2 className="!mt-0 text-label-lg text-ink">The desk</h2>
        <ul className="mt-space-4 grid grid-cols-2 gap-space-4 sm:grid-cols-3">
          {DESK.map((person) => (
            <li key={person.name} className="flex flex-col items-start">
              <Avatar name={person.name} size={64} className="text-ink" />
              <p className="mt-space-3 text-heading-4 text-ink">{person.name}</p>
              <p className="text-caption text-ink-muted">{person.role}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-space-2 border-t border-rule pt-space-5">
        <Link href="/editorial-policy" className="inline-flex h-10 items-center border border-ink px-space-4 text-body-sm !text-ink !no-underline transition-colors hover:bg-ink hover:!text-paper">
          Editorial policy
        </Link>
        <Link href="/contact" className="inline-flex h-10 items-center border border-ink px-space-4 text-body-sm !text-ink !no-underline transition-colors hover:bg-ink hover:!text-paper">
          Contact the desk
        </Link>
        <Link href="/pr" className="inline-flex h-10 items-center border border-ink px-space-4 text-body-sm !text-ink !no-underline transition-colors hover:bg-ink hover:!text-paper">
          PR &amp; Distribution
        </Link>
      </div>
    </StaticPage>
  );
}
