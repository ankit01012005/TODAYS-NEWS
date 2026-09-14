import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { StaticPage } from "@/components/public/StaticPage";
import { OnThisPage } from "@/components/public/OnThisPage";
import { CONTACTS, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Editorial policy" };

/// 2d — the trust page: the reader-facing version of the workflow the
/// API enforces. What partners read before syndicating, so it is written
/// plainly and in the order the wireframe sets.
const SECTIONS = [
  { id: "how-we-report", label: "How we report" },
  { id: "sourcing", label: "Sourcing" },
  { id: "review", label: "Review & publishing" },
  { id: "corrections", label: "Corrections" },
  { id: "withdrawals", label: "Withdrawals" },
  { id: "images", label: "Images & credit" },
  { id: "social-picks", label: "Social picks" },
  { id: "complaints", label: "Complaints" },
];

export default async function EditorialPolicyPage() {
  return (
    <StaticPage
      kicker="Editorial policy"
      title="How we work."
      intro="Every story on this site went through the same process, and this page is that process written down — what we do before something is published, and what we do when we get it wrong."
      aside={<OnThisPage items={SECTIONS} />}
      activePath="/editorial-policy"
    >
      <h2 id="how-we-report">How we report</h2>
      <p>
        We report from where it happens. A story starts with a reporter on the ground or on the
        phone, not with a press release. We separate what we saw from what we were told, and we say
        which is which.
      </p>

      <h2 id="sourcing">Sourcing</h2>
      <p>
        Each story carries the sources the newsroom chose to show, beneath the text. A source marked
        <em> verified</em> has been checked and vouched for by an editor — that vouch is recorded,
        with who made it and when. Sources we rely on but cannot name are still recorded internally;
        they are simply not shown.
      </p>

      <h2 id="review">Review &amp; publishing</h2>
      <div className="border border-success bg-success-wash p-space-4">
        <p className="flex items-center gap-x-space-2 text-label-lg text-success">
          <ShieldCheck size={14} aria-hidden="true" />
          Every story is reviewed
        </p>
        <p className="mt-space-2 text-body text-ink">
          No story reaches this site without a second person approving it. Nothing an editor saves
          changes what you read until then, and no one both writes and approves the same story.
        </p>
      </div>
      <p>
        The person approving a story can also send it back with notes, or decline to run it. Those
        decisions, and the reasons for them, stay on the story&rsquo;s record.
      </p>

      <h2 id="corrections">Corrections</h2>
      <p>
        When we get something wrong, we correct it. A correction is written as a new version of the
        story and goes through the same review as the original; readers keep seeing the published
        version until the corrected one is approved. The original is never silently altered or
        deleted. To request a correction, write to{" "}
        <a href={`mailto:${CONTACTS.corrections}`}>{CONTACTS.corrections}</a>.
      </p>

      <h2 id="withdrawals">Withdrawals</h2>
      <p>
        Occasionally a story has to be taken down. Withdrawing a story requires a reason, removes it
        from the site, the feed and search engines at once, and is recorded. The record of its
        publication is kept internally.
      </p>

      <h2 id="images">Images &amp; credit</h2>
      <p>
        Every photograph carries a description for readers who cannot see it and, where one is
        due, a credit. We do not publish an image without both. Photography is licensed separately
        from the text it accompanies.
      </p>

      <h2 id="social-picks">Social picks</h2>
      <p>
        &ldquo;Top on social&rdquo; on the front page is a short list of posts our editors think are
        worth your time that day. They are chosen by hand, link out to the platform, and are not{" "}
        {SITE_NAME}&rsquo;s reporting — nothing from a social platform is embedded or fetched here.
      </p>

      <h2 id="complaints">Complaints</h2>
      <p>
        If you think we have treated you or a story unfairly, tell us. Write to{" "}
        <a href={`mailto:${CONTACTS.corrections}`}>{CONTACTS.corrections}</a> and a member of the
        desk who was not involved in the story will reply within two working days. See also{" "}
        <Link href="/contact">how to reach us</Link>.
      </p>
    </StaticPage>
  );
}
