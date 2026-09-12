import { config } from "../config";

/// docs/27 B3 — publish-time cache invalidation. Public pages are served
/// from the Next.js app's data cache (frontend/lib/api/public.ts tags every
/// public read "public"); without this, a story that was just published,
/// corrected or withdrawn stays as it was until the fixed revalidation
/// window runs out. The API tells the frontend to drop that tag the moment
/// the transaction has committed.
///
/// Fire-and-forget by design: the transition has already happened, so a
/// failure here is logged for the operator, never surfaced to the admin
/// as if the publish failed. The fixed window still bounds the damage.
const REVALIDATE_TIMEOUT_MS = 5_000;

export function invalidatePublicCache(reason: "publish" | "unpublish", articleId: string): void {
  if (!config.REVALIDATE_SECRET) {
    // Development without the frontend hook configured: the 60 s window
    // in public.ts is the fallback. Production refuses to boot this way
    // (env.validation.ts).
    return;
  }

  void fetch(`${config.APP_BASE_URL}/api/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.REVALIDATE_SECRET}`,
    },
    body: JSON.stringify({ tags: ["public"] }),
    signal: AbortSignal.timeout(REVALIDATE_TIMEOUT_MS),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`frontend answered ${res.status}`);
    })
    .catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          time: new Date().toISOString(),
          level: "error",
          event: "cache.revalidate.failed",
          reason,
          articleId,
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    });
}
