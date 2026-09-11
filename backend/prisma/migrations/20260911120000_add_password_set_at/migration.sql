-- users.password_set_at — when the person last chose a password themselves.
-- NULL means the invitation has never been accepted, which is what lets an
-- admin re-send it and what the staff directory shows as "invitation
-- pending". Backfill: anyone with no outstanding set-password token, or
-- who has ever signed in (a session exists), has a real password today;
-- treat their account creation as the moment it was set. Anyone else is
-- genuinely pending.
ALTER TABLE "users" ADD COLUMN "password_set_at" TIMESTAMP(3);

UPDATE "users" u
SET "password_set_at" = u."created_at"
WHERE u."password_reset_token_hash" IS NULL
   OR EXISTS (SELECT 1 FROM "sessions" s WHERE s."user_id" = u."id");
