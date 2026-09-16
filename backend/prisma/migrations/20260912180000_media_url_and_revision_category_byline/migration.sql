-- docs/27 B1 — media moves to object storage (Cloudinary). Every asset
-- records the public URL it was given at upload time; that column, not a
-- path derived from storage_key, is the only image address the API uses.
-- Rows uploaded under the old local-disk adapter keep a /uploads/... value
-- so the backfill is lossless, but nothing serves that path any more —
-- re-upload any image that must stay reachable.
ALTER TABLE "media_assets" ADD COLUMN "url" TEXT;
UPDATE "media_assets" SET "url" = '/uploads/' || "storage_key";
ALTER TABLE "media_assets" ALTER COLUMN "url" SET NOT NULL;

-- docs/27 A1 — the section and byline being edited live on the revision;
-- articles.category_id / byline_override become the PUBLISHED values and
-- are only ever written by the publish transition from that point on.
-- Backfill every existing revision from its article so nothing changes
-- for readers on deploy.
ALTER TABLE "article_revisions" ADD COLUMN "category_id" UUID;
ALTER TABLE "article_revisions" ADD COLUMN "byline_override" TEXT;

UPDATE "article_revisions" r
SET "category_id" = a."category_id",
    "byline_override" = a."byline_override"
FROM "articles" a
WHERE a."id" = r."article_id";

ALTER TABLE "article_revisions" ALTER COLUMN "category_id" SET NOT NULL;

ALTER TABLE "article_revisions"
  ADD CONSTRAINT "article_revisions_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
