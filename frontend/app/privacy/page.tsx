import type { Metadata } from "next";
import { StaticPage } from "@/components/public/StaticPage";

export const metadata: Metadata = { title: "Privacy — Today News" };

/// PG-PUB-08 — legally required disclosure about data handling. V1 has no
/// reader accounts, no comments, no tracking of individual readers
/// (docs/08 §5) -- the actual privacy posture is genuinely simple; this
/// reflects that rather than a boilerplate policy for features that don't
/// exist. Depends on OQ-32/OQ-34 (privacy law, analytics scope) for
/// anything beyond this baseline -- both still open, noted rather than
/// guessed at.
export default async function PrivacyPage() {
  return (
    <StaticPage title="Privacy">
      <p>
        Today News does not require an account to read our site, and we do not collect or store
        personal information about readers.
      </p>
      <p>
        We do not use reader tracking, comments, or newsletters. If that changes, this page will be
        updated to describe exactly what is collected and why.
      </p>
    </StaticPage>
  );
}
