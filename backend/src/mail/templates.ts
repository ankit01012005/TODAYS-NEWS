import { MailMessage } from "./mailer";

/// The two messages the product sends (docs/23 §11.3 — invitation and
/// password reset share one token mechanism, so they share one template
/// shape). Plain text is the primary body; the HTML is the same content
/// with one button. Every interpolated value is escaped for the HTML
/// variant — display names are staff-entered, not trusted markup.

const SITE_NAME = "Today News";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, paragraphs: string[], link: string, buttonLabel: string, footer: string): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px">${escapeHtml(p)}</p>`).join("");
  const safeLink = escapeHtml(link);
  return `<!doctype html><html><body style="margin:0;background:#f8f5ef;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#14161a">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;letter-spacing:-0.02em;margin:0 0 24px">${SITE_NAME}<span style="color:#9b2c1e">.</span></p>
  <div style="background:#fffdf9;border:1px solid #e6e2da;border-top:2px solid #9b2c1e;padding:24px">
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;margin:0 0 16px">${escapeHtml(title)}</h1>
    ${body}
    <p style="margin:24px 0"><a href="${safeLink}" style="display:inline-block;background:#14161a;color:#fffdf9;text-decoration:none;padding:12px 20px;border-radius:3px;font-weight:600">${escapeHtml(buttonLabel)}</a></p>
    <p style="margin:0;font-size:13px;color:#5b6068">If the button doesn’t work, copy this address into your browser:<br><a href="${safeLink}" style="color:#14161a;word-break:break-all">${safeLink}</a></p>
  </div>
  <p style="font-size:13px;color:#5b6068;margin:16px 0 0">${escapeHtml(footer)}</p>
</div></body></html>`;
}

export function invitationEmail(input: {
  to: string;
  displayName: string;
  invitedBy: string;
  link: string;
  expiresInDays: number;
}): MailMessage {
  const title = `You’ve been invited to the ${SITE_NAME} newsroom`;
  const paragraphs = [
    `Hello ${input.displayName},`,
    `${input.invitedBy} has set up a ${SITE_NAME} staff account for you. Choose a password to start using it.`,
    `This link works for ${input.expiresInDays} days and can be used once.`,
  ];
  const footer = `If you weren’t expecting this, you can ignore it — nothing happens until a password is set.`;
  return {
    to: input.to,
    subject: title,
    text: [...paragraphs, "", `Set your password: ${input.link}`, "", footer].join("\n"),
    html: layout(title, paragraphs, input.link, "Set your password", footer),
  };
}

export function passwordResetEmail(input: { to: string; link: string; expiresInMinutes: number }): MailMessage {
  const title = `Reset your ${SITE_NAME} password`;
  const paragraphs = [
    `Someone asked to reset the password for the ${SITE_NAME} account at this address.`,
    `This link works for ${input.expiresInMinutes} minutes and can be used once.`,
  ];
  const footer = `If that wasn’t you, ignore this message — your password stays as it is.`;
  return {
    to: input.to,
    subject: title,
    text: [...paragraphs, "", `Choose a new password: ${input.link}`, "", footer].join("\n"),
    html: layout(title, paragraphs, input.link, "Choose a new password", footer),
  };
}
