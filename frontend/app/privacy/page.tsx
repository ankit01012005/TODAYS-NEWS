import type { Metadata } from "next";
import { StaticPage } from "@/components/public/StaticPage";
import { CONTACTS, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy" };

/// 2e — what we collect, in four short sections. The site has no reader
/// accounts, no comments and no tracking of individual readers, so the
/// actual posture is simple and this page says exactly that rather than
/// boilerplate for features that don't exist. Needs a legal read before
/// launch (docs/27 E1).
const LAST_UPDATED = "2026-09-14";

export default async function PrivacyPage() {
  return (
    <StaticPage kicker="Privacy" title="What we keep, and what we don’t." activePath="/privacy">
      <p className="!mt-0 text-mono text-ink-muted">Last updated {LAST_UPDATED}</p>

      <h2>What we collect</h2>
      <p>
        Reading {SITE_NAME} needs no account. We do not collect or store personal information about
        readers, and we do not run advertising or analytics that identify you. Our web server keeps
        ordinary access logs for a short time to keep the site running and secure.
      </p>

      <h2>Cookies</h2>
      <p>
        The public site sets no cookies. One session cookie exists, for signed-in newsroom staff
        only — readers never receive it.
      </p>

      <h2>Images &amp; CDN</h2>
      <p>
        Photographs are served from a content delivery network, which sees the request for the
        image the way any web server would. Nothing else on our pages loads from a third party.
      </p>

      <h2>Writing to us</h2>
      <p>
        When you email a tip, a correction or a pitch, we keep that correspondence for as long as
        the story needs it. To ask what we hold or to have it removed, write to{" "}
        <a href={`mailto:${CONTACTS.privacy}`}>{CONTACTS.privacy}</a>.
      </p>
    </StaticPage>
  );
}
