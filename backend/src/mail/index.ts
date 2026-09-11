import { config } from "../config";
import { Mailer } from "./mailer";
import { ConsoleMailer } from "./console.mailer";
import { SmtpMailer } from "./smtp.mailer";

export type { Mailer, MailMessage, MailTransportKind } from "./mailer";
export { invitationEmail, passwordResetEmail } from "./templates";

/// Chosen once from MAIL_TRANSPORT (env.validation.ts guarantees the SMTP
/// settings exist when "smtp" is selected, and that production is never
/// "console").
function createMailer(): Mailer {
  if (config.MAIL_TRANSPORT === "smtp") {
    return new SmtpMailer(config.SMTP_URL!, config.MAIL_FROM!);
  }
  return new ConsoleMailer();
}

export const mailer: Mailer = createMailer();

/// Builds the link a message points at. Always the Next.js app's origin,
/// never this API's — the token is spent through the app's set-password
/// page (docs/23 §4.4).
export function appLink(path: string, token: string): string {
  const url = new URL(path, config.APP_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

/// Called from main.ts after listen(): a misconfigured SMTP server is
/// logged loudly at boot rather than discovered on the first invitation.
/// Non-fatal — a provider blip at deploy time shouldn't take the news
/// site down with it.
export async function verifyMailer(): Promise<void> {
  if (!(mailer instanceof SmtpMailer)) return;
  try {
    await mailer.verify();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ time: new Date().toISOString(), level: "info", event: "mail.smtp.verified" }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        time: new Date().toISOString(),
        level: "error",
        event: "mail.smtp.unreachable",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
