import type { Metadata } from "next";
import { StaticPage } from "@/components/public/StaticPage";

export const metadata: Metadata = { title: "About — Today News" };

/// PG-PUB-05 — who the publication is; a credibility signal for readers
/// and search engines.
export default async function AboutPage() {
  return (
    <StaticPage title="About Today News">
      <p>
        Today News is an independent news publication covering the stories that matter, reported and
        edited by our newsroom before anything reaches a reader.
      </p>
      <p>
        Every story on this site has gone through the same process: written by a member of our staff,
        reviewed by an editor, and published only once approved. Nothing goes live automatically.
      </p>
    </StaticPage>
  );
}
