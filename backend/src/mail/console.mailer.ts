import { MailMessage, Mailer } from "./mailer";

/// Development transport: one structured log line per message, with the
/// plain-text body (which carries the link) so whoever is running the API
/// can copy it. Never selected in production (env.validation.ts).
export class ConsoleMailer implements Mailer {
  readonly kind = "console" as const;

  async send(message: MailMessage): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        level: "info",
        event: "mail.console",
        to: message.to,
        subject: message.subject,
        text: message.text,
      }),
    );
  }
}
