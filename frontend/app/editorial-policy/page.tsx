import type { Metadata } from "next";
import { StaticPage } from "@/components/public/StaticPage";

export const metadata: Metadata = { title: "Editorial policy — Today News" };

/// PG-PUB-07 — how the publication handles accuracy, corrections and
/// withdrawals. This is the page a correction notice would link to
/// (docs/19 §3.10, OQ-09 — not yet built; the notice component itself is
/// future scope until OQ-09 is answered), and what makes "withdrawn"
/// mean something rather than just disappearing silently.
export default async function EditorialPolicyPage() {
  return (
    <StaticPage title="Editorial policy">
      <p>
        Every story published on Today News is written by a member of our staff and reviewed by an
        editor before it goes live. Nothing is published automatically, and no single person both
        writes and approves the same story.
      </p>
      <p>
        When we get something wrong, we correct it. A correction to a published story replaces the
        live version once it has been reviewed; the original version is never simply deleted or
        silently altered.
      </p>
      <p>
        If a story is withdrawn from the site, it is removed from listings and search engines, but the
        record of its publication is retained internally.
      </p>
    </StaticPage>
  );
}
