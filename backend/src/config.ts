import { loadEnvFile } from "./config/load-env";
import { validateEnv } from "./config/env.validation";

// Before anything reads a variable. See load-env.ts: boot used to depend
// on Prisma importing `.env` as a side effect, and therefore on the import
// order of unrelated modules.
loadEnvFile();

/// Resolved once, at process start. Fails fast (see env.validation.ts) if
/// required configuration is missing, rather than surfacing a confusing
/// error on the first request that needs it.
export const config = validateEnv(process.env);
