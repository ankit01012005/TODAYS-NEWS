/// Loads `.env` into process.env, explicitly and first.
///
/// Until this existed, nothing in the codebase loaded `.env` on purpose.
/// It worked only because `@prisma/client` reads `.env` as a side effect of
/// being imported, and `app.ts` happened to import a module that imports
/// `db.ts` *before* it imported `config.ts`. Boot therefore depended on the
/// import order of two unrelated files: adding one import to a middleware
/// changed that order and the process died at startup with
/// "Missing required environment variable: DATABASE_URL" — with a perfectly
/// valid `.env` sitting next to it.
///
/// That is a bad failure to discover during a deploy, so configuration
/// loading is now something the process does deliberately, before anything
/// reads a variable.
///
/// Production is unaffected either way: there is no `.env` file in a
/// container, the platform supplies the environment, and a missing file
/// here is not an error.

import { existsSync } from "fs";
import { resolve } from "path";

let loaded = false;

export function loadEnvFile(): void {
  if (loaded) return;
  loaded = true;

  // Relative to the working directory, which is the package root for both
  // `ts-node src/main.ts` and `node dist/main.js`.
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;

  // Node's own loader (20.6+). No dependency, and it does not overwrite a
  // variable the platform already set — an explicit environment always
  // wins over a file left in the working directory.
  const load = (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof load !== "function") return;

  try {
    load.call(process, path);
  } catch {
    // A malformed or unreadable .env must not be a silent half-load: let
    // validation report precisely which variables are missing instead.
  }
}
