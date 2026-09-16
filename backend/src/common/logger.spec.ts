import { logger } from "./logger";

/// Captures what the logger actually wrote, parsed back from the stream.
/// Asserting on the parsed object rather than the string is the point: the
/// guarantee this module owes a log shipper is "one valid JSON object per
/// line", and a test on substrings would not catch a broken one.
function capture(level: "info" | "warn" | "error", run: () => void): Record<string, unknown>[] {
  const previousLevel = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = "debug";
  // Both streams are stubbed even though only one is read back, so a line
  // that lands on the wrong stream is silently swallowed rather than
  // printed into the test report.
  const out = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  const err = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  try {
    run();
    const spy = level === "info" ? out : err;
    return spy.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);
  } finally {
    out.mockRestore();
    err.mockRestore();
    process.env.LOG_LEVEL = previousLevel;
  }
}

describe("logger", () => {
  it("writes exactly one JSON object per call, with time, level and event", () => {
    const [line] = capture("info", () => logger.info("request", { status: 200 }));

    expect(line.event).toBe("request");
    expect(line.level).toBe("info");
    expect(line.status).toBe(200);
    expect(typeof line.time).toBe("string");
    expect(new Date(line.time as string).toString()).not.toBe("Invalid Date");
  });

  it("sends info to stdout and warn/error to stderr", () => {
    expect(capture("info", () => logger.info("a"))).toHaveLength(1);
    expect(capture("warn", () => logger.warn("b"))).toHaveLength(1);
    expect(capture("error", () => logger.error("c"))).toHaveLength(1);
    // An info line must not also appear on stderr.
    expect(capture("error", () => logger.info("d"))).toHaveLength(0);
  });

  it("redacts anything whose key names a credential — SEC-06", () => {
    const [line] = capture("info", () =>
      logger.info("signin", {
        email: "editor@test.local",
        password: "hunter2",
        passwordHash: "$argon2id$...",
        sessionToken: "abc",
        Authorization: "Bearer xyz",
        nested: { smtp_url: "smtps://user:pass@host", safe: "kept" },
      }),
    );

    expect(line.email).toBe("editor@test.local");
    expect(line.password).toBe("[redacted]");
    expect(line.passwordHash).toBe("[redacted]");
    expect(line.sessionToken).toBe("[redacted]");
    expect(line.Authorization).toBe("[redacted]");
    expect(line.nested).toEqual({ smtp_url: "[redacted]", safe: "kept" });
  });

  it("serialises an Error instead of stringifying it to {}", () => {
    const error = Object.assign(new Error("Can't reach database server"), { code: "P1001" });
    const [line] = capture("error", () => logger.error("request.unavailable", { err: error }));

    const err = line.err as Record<string, unknown>;
    expect(err.name).toBe("Error");
    expect(err.message).toBe("Can't reach database server");
    // The machine-readable code is what an alert rule keys on.
    expect(err.code).toBe("P1001");
  });

  it("honours LOG_LEVEL, including silent", () => {
    const previous = process.env.LOG_LEVEL;
    const spy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      process.env.LOG_LEVEL = "error";
      logger.warn("suppressed");
      expect(spy).not.toHaveBeenCalled();

      logger.error("kept");
      expect(spy).toHaveBeenCalledTimes(1);

      process.env.LOG_LEVEL = "silent";
      logger.error("also suppressed");
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
      process.env.LOG_LEVEL = previous;
    }
  });
});
