/// The app's own public origin, and absolute URLs built from it.
///
/// Both live in lib/env.ts now, alongside the validation. This file stays
/// as the import path the rest of the app already uses.
export { siteUrl, absoluteUrl } from "./env";
