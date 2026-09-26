import { config } from "../config";
import { logger } from "../common/logger";
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
    logger.info("mail.smtp.verified");
  } catch (error) {
    logger.error("mail.smtp.unreachable", { err: error, hint: smtpFailureHint(error) });
  }
}

/// Both ways this fails in practice are configuration, and neither says so.
/// The provider's own error is a timeout or a line of OpenSSL, so the
/// diagnosis is written down here rather than rediscovered under pressure.
function smtpFailureHint(error: unknown): string | undefined {
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err?.code === "string" ? err.code : "";
  const message = typeof err?.message === "string" ? err.message : "";

  // TLS offered to a port that opens in the clear: the plaintext greeting
  // arrives where a TLS record was expected. smtps:// speaks TLS from the
  // first byte; 587 and 2587 want smtp:// and STARTTLS instead.
  if (/wrong version number|packet length too long/i.test(message)) {
    return "SMTP_URL uses smtps:// against a port that expects STARTTLS — use smtp:// for 587/2587, or keep smtps:// and move to 465/2465";
  }
  // Nothing answered at all. Hosts block outbound 25/465/587 to keep spam
  // off their address space, and drop the traffic rather than refuse it.
  if (code === "ETIMEDOUT" || /timeout/i.test(message)) {
    return "nothing answered — the host may block outbound SMTP on this port; providers publish alternatives above the blocked range (Resend: 2465 for smtps://, 2587 for smtp://)";
  }
  return undefined;
}
