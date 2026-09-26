import nodemailer, { Transporter } from "nodemailer";
import { MailMessage, Mailer } from "./mailer";

/// Production transport over SMTP. SMTP_URL carries host, port, auth and
/// TLS in one value (smtps://user:pass@host:465 or
/// smtp://user:pass@host:587 with STARTTLS), which is what every hosted
/// provider (Postmark, SES, Resend, Mailgun, Google Workspace) documents.
/// A single pooled transporter for the process; nodemailer reconnects on
/// its own.
///
/// Note on ports: many hosts block outbound 25, 465 and 587 outright to
/// keep spam off their address space — Render does on its smaller plans,
/// and the symptom is not a refusal but silence, a connection that never
/// completes. Providers publish high alternatives for exactly this
/// (Resend answers on 2465 and 2587); reach for one of those before
/// concluding the credentials are wrong.
export class SmtpMailer implements Mailer {
  readonly kind = "smtp" as const;
  private readonly transporter: Transporter;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    this.transporter = nodemailer.createTransport({
      url: smtpUrl,
      pool: true,
      maxConnections: 2,
      // Bounded, because the default is not. A host that silently drops
      // traffic to the SMTP port leaves every connection hanging until
      // something times out, and an invitation is sent inside the request
      // that creates the account: one blocked port turned POST /users into
      // a 241-second request in production, holding a worker on the single
      // API instance for four minutes to deliver nothing. Failing in
      // seconds is the difference between a logged mail error and an
      // outage.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      // smtp:// (as against smtps://) opens in the clear and upgrades only
      // if the server advertises STARTTLS — and if it does not, nodemailer
      // carries on and puts the AUTH credentials on the wire in plaintext.
      // This makes the upgrade mandatory instead: STARTTLS or an error.
      // Harmless on smtps://, where TLS is already up before EHLO.
      requireTLS: true,
    });
  }

  /// Handshake with the server without sending. Called once at boot so a
  /// misconfigured provider is noticed at deploy time, not on the first
  /// invitation.
  verify(): Promise<true> {
    return this.transporter.verify();
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
