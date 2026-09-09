/// Local-disk media (media/storage.ts's placeholder adapter) is served
/// under /uploads/... via next.config.ts's rewrite to the backend — the
/// same relative path public.view.ts already resolves a featuredImage's
/// storageKey to. The CMS's private views only ever carry a bare
/// featuredImageId, so this does the same storageKey -> relative-URL join
/// by hand for the editor's own picker/preview surfaces.
export function mediaUrl(storageKey: string): string {
  return `/uploads/${storageKey}`;
}
