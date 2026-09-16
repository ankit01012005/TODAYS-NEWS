// Suppress the structured logger during tests. Several suites deliberately
// drive a failure path and assert that it was logged; without this each of
// those printed a genuine stack trace into the test report, where it looks
// exactly like a broken test. A test that needs to assert on a log line
// raises LOG_LEVEL for its own duration (see auth.service.spec.ts).
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "silent";
