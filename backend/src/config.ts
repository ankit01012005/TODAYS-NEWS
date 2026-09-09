import { validateEnv } from "./config/env.validation";

/// Resolved once, at process start. Fails fast (see env.validation.ts) if
/// required configuration is missing, rather than surfacing a confusing
/// error on the first request that needs it.
export const config = validateEnv(process.env);
