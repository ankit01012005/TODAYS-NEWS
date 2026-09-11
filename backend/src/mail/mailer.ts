/// The one interface the rest of the API sends mail through. Two
/// implementations: SMTP (production) and console (development/test —
/// prints the message, including its link, to stdout so the flow can be
/// exercised without a provider). Chosen once at boot from MAIL_TRANSPORT
/// (see index.ts); nothing else in the codebase knows which is active
/// beyond `kind`, which the users API uses to decide whether it may echo an
/// invitation link back to the admin.
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type MailTransportKind = "smtp" | "console";

export interface Mailer {
  readonly kind: MailTransportKind;
  send(message: MailMessage): Promise<void>;
}
