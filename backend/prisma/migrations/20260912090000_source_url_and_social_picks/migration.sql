-- Sources gain an outbound link (OQ-24 resolved 2026-09-12): where the
-- source lives online, shown to readers.
ALTER TABLE "sources" ADD COLUMN "url" TEXT;

-- "Top on social": hand-picked posts staff find each day. No automation.
CREATE TYPE "social_platform" AS ENUM ('INSTAGRAM', 'X', 'OTHER');

CREATE TABLE "social_picks" (
  "id" UUID NOT NULL,
  "platform" "social_platform" NOT NULL,
  "account_handle" TEXT NOT NULL,
  "headline" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "created_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "social_picks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_picks_deleted_at_created_at_idx" ON "social_picks"("deleted_at", "created_at");

ALTER TABLE "social_picks"
  ADD CONSTRAINT "social_picks_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
