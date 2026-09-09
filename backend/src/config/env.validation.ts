/// Fails fast at boot if required configuration is missing, rather than
/// surfacing a confusing error on the first request that needs it.

export interface AppEnv {
  DATABASE_URL: string;
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  SESSION_COOKIE_NAME: string;
  SESSION_TTL_HOURS: number;
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

  return {
    DATABASE_URL: config.DATABASE_URL as string,
    NODE_ENV: nodeEnv as AppEnv["NODE_ENV"],
    PORT: port,
    SESSION_COOKIE_NAME: (config.SESSION_COOKIE_NAME as string) ?? "today_news_session",
    SESSION_TTL_HOURS: sessionTtlHours,
  };
}
