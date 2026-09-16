import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StaticPage } from "@/components/public/StaticPage";
import { MailForm } from "@/components/public/MailForm";
import { CONTACTS } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

/// 2c — four ways in, one form. The form composes an email; the public
/// site posts nothing anywhere.
const WAYS_IN = [
  { title: "News tip", detail: CONTACTS.tips, href: `mailto:${CONTACTS.tips}`, action: "Write" },
  { title: "Correction request", detail: CONTACTS.corrections, href: `mailto:${CONTACTS.corrections}`, action: "Write" },
  { title: "PR & partnerships", detail: "see PR & Distribution", href: "/pr", action: "Open" },
  { title: "Work with us", detail: CONTACTS.careers, href: `mailto:${CONTACTS.careers}`, action: "Write" },
];

export default async function ContactPage() {
  return (
    <StaticPage
      title="Talk to us."
      intro="A tip, a correction, a partnership or a job — every message reaches a person on the desk, and we reply within two working days."
      activePath="/contact"
    >
      <ul className="!mt-space-5 divide-y divide-rule border-t border-rule">
        {WAYS_IN.map((way) => {
          const external = way.href.startsWith("mailto:");
          const inner = (
            <>
              <span className="min-w-0">
                <span className="block text-heading-4 text-ink">{way.title}</span>
                <span className="mt-space-1 block text-mono text-ink-muted">{way.detail}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-x-space-1 text-body-sm text-brand">
                {way.action} <ArrowRight size={14} aria-hidden="true" />
              </span>
            </>
          );
          const className = "group flex items-baseline justify-between gap-x-space-4 py-space-4 !no-underline";
          return (
            <li key={way.title}>
              {external ? (
                <a href={way.href} className={className}>
                  {inner}
                </a>
              ) : (
                <Link href={way.href} className={className}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <div className="!mt-space-6">
        <MailForm
          heading="Send a message"
          to={CONTACTS.general}
          subjectPrefix="Message from anvaytv"
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            {
              name: "subject",
              label: "Subject",
              type: "select",
              placeholder: "What is it about?",
              options: ["News tip", "Correction", "PR & partnerships", "Other"],
            },
            { name: "message", label: "Message", type: "textarea", required: true },
          ]}
          note="We reply within two working days."
        />
      </div>
    </StaticPage>
  );
}
