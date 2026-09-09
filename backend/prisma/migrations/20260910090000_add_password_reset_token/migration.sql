-- Phase 4C-1: password-reset / invitation token fields on users.
-- Purely additive — two nullable columns and a unique index. No data
-- migration needed; existing rows get NULL, which is the correct "no
-- pending token" state. See schema.prisma's User model doc-comment.

ALTER TABLE "users"
  ADD COLUMN "password_reset_token_hash" TEXT,
  ADD COLUMN "password_reset_expires_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_password_reset_token_hash_key"
  ON "users"("password_reset_token_hash");
