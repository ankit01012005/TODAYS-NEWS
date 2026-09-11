/// Fails fast at boot if required configuration is missing, rather than
/// surfacing a confusing error on the first request that needs it.

export interface AppEnv {
  DATABASE_URL: string;
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  SESSION_COOKIE_NAME: string;
  SESSION_TTL_HOURS: number;
  /// Origins allowed to make credentialed cross-origin requests. Empty by
  /// default: the browser never calls this API directly (docs/23 §11.4).
  CORS_ORIGINS: string[];
  /// Express "trust proxy" setting — number of proxy hops in front of this
  /// process, or 0 when it is reached directly. Needed for correct client
  /// IPs in rate limiting and logs once deployed behind a load balancer.
  TRUST_PROXY: number;
  /// Where invitation and reset emails go: "smtp" (SMTP_URL + MAIL_FROM) or
  /// "console" (printed to stdout; development and test only).
  MAIL_TRANSPORT: "smtp" | "console";
  SMTP_URL: string | null;
  MAIL_FROM: string | null;
  /// The public origin of the Next.js app, used to build the links inside
  /// those emails (…/staff/accept-invitation?token=…).
  APP_BASE_URL: string;
}

const REQUIRED_KEYS = ["DATABASE_URL"] as const;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  for (const key of REQUIRED_KEYS) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const nodeEnv = (config.NODE_ENV as string) ?? "development";
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
  }

  const port = Number(config.PORT ?? 3001);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${String(config.PORT)}`);
  }

  const sessionTtlHours = Number(config.SESSION_TTL_HOURS ?? 12);
  if (!Number.isFinite(sessionTtlHours) || sessionTtlHours <= 0) {
    throw new Error(`Invalid SESSION_TTL_HOURS: ${String(config.SESSION_TTL_HOURS)}`);
  }

  const corsOrigins = String(config.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of corsOrigins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`Invalid CORS_ORIGINS entry (must be a full origin): ${origin}`);
    }
    if (parsed.origin !== origin) {
      throw new Error(`Invalid CORS_ORIGINS entry (must be an origin without a path): ${origin}`);
    }
  }

  const trustProxy = Number(config.TRUST_PROXY ?? 0);
  if (!Number.isInteger(trustProxy) || trustProxy < 0) {
    throw new Error(`Invalid TRUST_PROXY: ${String(config.TRUST_PROXY)}`);
  }

  const mailTransport = String(config.MAIL_TRANSPORT ?? (nodeEnv === "production" ? "smtp" : "console"));
  if (mailTransport !== "smtp" && mailTransport !== "console") {
    throw new Error(`Invalid MAIL_TRANSPORT: ${mailTransport} (expected "smtp" or "console")`);
  }
  if (nodeEnv === "production" && mailTransport !== "smtp") {
    // A newsroom that can't email invitations can't onboard anyone; refuse
    // to start rather than fail on the first invite.
    throw new Error('MAIL_TRANSPORT must be "smtp" in production');
  }
  const smtpUrl = config.SMTP_URL ? String(config.SMTP_URL) : null;
  const mailFrom = config.MAIL_FROM ? String(config.MAIL_FROM) : null;
  if (mailTransport === "smtp") {
    if (!smtpUrl) throw new Error("SMTP_URL is required when MAIL_TRANSPORT=smtp");
    if (!/^smtps?:\/\//.test(smtpUrl)) throw new Error("SMTP_URL must start with smtp:// or smtps://");
    if (!mailFrom) throw new Error("MAIL_FROM is required when MAIL_TRANSPORT=smtp");
  }

  const appBaseUrl = String(config.APP_BASE_URL ?? "http://localhost:3000");
  let parsedAppBaseUrl: URL;
  try {
    parsedAppBaseUrl = new URL(appBaseUrl);
  } catch {
    throw new Error(`Invalid APP_BASE_URL: ${appBaseUrl}`);
  }
  if (nodeEnv === "production" && parsedAppBaseUrl.protocol !== "https:") {
    throw new Error("APP_BASE_URL must be https in production (it goes into emailed links)");
  }

  return {
    DATABASE_URL: config.DATABASE_URL as string,
    NODE_ENV: nodeEnv as AppEnv["NODE_ENV"],
    PORT: port,
    SESSION_COOKIE_NAME: (config.SESSION_COOKIE_NAME as string) ?? "today_news_session",
    SESSION_TTL_HOURS: sessionTtlHours,
    CORS_ORIGINS: corsOrigins,
    TRUST_PROXY: trustProxy,
    MAIL_TRANSPORT: mailTransport,
    SMTP_URL: smtpUrl,
    MAIL_FROM: mailFrom,
    APP_BASE_URL: parsedAppBaseUrl.origin,
  };
}
