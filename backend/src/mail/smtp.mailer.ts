import nodemailer, { Transporter } from "nodemailer";
import { MailMessage, Mailer } from "./mailer";

/// Production transport over SMTP. SMTP_URL carries host, port, auth and
/// TLS in one value (smtps://user:pass@host:465 or
/// smtp://user:pass@host:587 with STARTTLS), which is what every hosted
/// provider (Postmark, SES, Resend, Mailgun, Google Workspace) documents.
/// A single pooled transporter for the process; nodemailer reconnects on
/// its own.
export class SmtpMailer implements Mailer {
  readonly kind = "smtp" as const;
  private readonly transporter: Transporter;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    this.transporter = nodemailer.createTransport({ url: smtpUrl, pool: true, maxConnections: 2 });
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
