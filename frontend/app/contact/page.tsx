import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/public/StaticPage";

export const metadata: Metadata = { title: "Contact — Today News" };

/// PG-PUB-06 — how to reach the newsroom. Information only, no form
/// (P2-03): the public site is read-only and readers submit nothing; a
/// contact form would contradict that and bring spam/abuse/personal-data
/// handling with it that hasn't been designed.
export default async function ContactPage() {
  return (
    <StaticPage title="Contact">
      <p>
        For general inquiries, email{" "}
        <a href="mailto:hello@todaynews.example" className="text-accent underline">
          hello@todaynews.example
        </a>
        .
      </p>
      <p>
        To report a factual error or request a correction, email{" "}
        <a href="mailto:corrections@todaynews.example" className="text-accent underline">
          corrections@todaynews.example
        </a>{" "}
        — see our{" "}
        <Link href="/editorial-policy" className="text-accent underline">
          editorial policy
        </Link>{" "}
        for how corrections are handled.
      </p>
    </StaticPage>
  );
}
