/// One structured log line per event, for the whole process.
///
/// Before this existed the codebase had three shapes — `console.log(JSON…)`
/// in the request logger, `console.error("text", errorObject)` in the error
/// handler, and hand-built JSON objects inside services. A log shipper can
/// only parse one of those, so the lines that mattered most (unhandled
/// exceptions) were the ones it could not index. Everything now goes
/// through here and comes out as a single JSON object per line.
///
/// Deliberately not a logging library: the API writes to stdout and the
/// platform collects it (docs/27 §Step 9). What a library would add here —
/// transports, rotation, pretty printers — is the platform's job, and the
/// dependency would have to be audited for a newsroom that stores
/// passwords and session tokens.
///
/// It also imports nothing of ours — not even config.ts. The logger has to
/// work while configuration is still being validated, which is precisely
/// when a boot failure needs to be reported; importing config here would
/// mean a bad .env crashed on the import instead of logging why.

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/// LOG_LEVEL accepts the four levels plus "silent", which suppresses
/// everything. "silent" is what the test run uses: several suites assert
/// that a failure IS logged, and without it every such test printed a real
/// stack trace into the report, where it reads like a broken test.
/// Read per call rather than cached at import: LOG_LEVEL then takes effect
/// whenever it is set, including from a test that needs one specific line
/// to come through, and an operator raising the level does not have to
/// restart the process. One env lookup is far cheaper than the
/// JSON.stringify it guards.
function threshold(): number {
  const raw = String(process.env.LOG_LEVEL ?? "").toLowerCase();
  if (raw === "silent") return Number.POSITIVE_INFINITY;
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") return LEVEL_ORDER[raw];
  return LEVEL_ORDER.info;
}

/// Keys whose values never belong in a log line, at any depth (SEC-06).
/// Matched case-insensitively on substrings so `passwordHash`,
/// `password_reset_token_hash` and `authorization` are all caught by the
/// three entries that name them.
const REDACT = ["password", "token", "secret", "cookie", "authorization", "smtp_url", "database_url"];

function isSensitive(key: string): boolean {
  const lower = key.toLowerCase();
  return REDACT.some((needle) => lower.includes(needle));
}

/// Errors do not survive JSON.stringify — `{}` is what a raw `new Error()`
/// serialises to, which is how stack traces went missing from structured
/// lines before. Pull the fields out explicitly instead.
function serialiseError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const out: Record<string, unknown> = { name: error.name, message: error.message };
    // Prisma and Node put their machine-readable code here; it is what an
    // alert rule keys on ("P1001 rate above zero"), so it must survive.
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" || typeof code === "number") out.code = code;
    // A stack is an operator's tool, not a public one — and in production
    // it can carry file paths and query fragments into a shared log index.
    if (process.env.NODE_ENV !== "production" || process.env.LOG_STACKS === "true") {
      out.stack = error.stack;
    }
    if (error.cause !== undefined) out.cause = serialiseError(error.cause);
    return out;
  }
  return { message: typeof error === "string" ? error : JSON.stringify(error) };
}

function sanitise(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth limit]";
  if (value === null || value === undefined) return value;
  if (value instanceof Error) return serialiseError(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitise(item, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitive(key) ? "[redacted]" : sanitise(inner, depth + 1);
    }
    return out;
  }
  return value;
}

export interface LogFields {
  [key: string]: unknown;
  /// The correlation id from request-id.middleware, so a log line and the
  /// id a user quotes from an error response join up (docs/23 §8.4).
  requestId?: string;
  err?: unknown;
}

function write(level: LogLevel, event: string, fields: LogFields = {}): void {
  if (LEVEL_ORDER[level] < threshold()) return;

  const { err, ...rest } = fields;
  const line = {
    time: new Date().toISOString(),
    level,
    event,
    ...(sanitise(rest) as Record<string, unknown>),
    ...(err !== undefined ? { err: serialiseError(err) } : {}),
  };

  // One line, one JSON object, on the stream the level implies — stdout for
  // ordinary events, stderr for problems, which is what process managers
  // and container runtimes expect.
  const stream = level === "error" || level === "warn" ? process.stderr : process.stdout;
  stream.write(`${JSON.stringify(line)}\n`);
}

export const logger = {
  debug: (event: string, fields?: LogFields) => write("debug", event, fields),
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
