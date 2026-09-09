-- Today_news — initial schema (Phase 4B database implementation)
--
-- This file has two parts.
--
-- PART 1 (below, unmodified) is generated directly from prisma/schema.prisma
-- via `prisma migrate diff --from-empty --to-schema-datamodel`. It creates
-- every table, enum, index, unique constraint and foreign key that Prisma's
-- schema language can express.
--
-- PART 2 (bottom of this file) is hand-written raw SQL for the invariants in
-- docs/26-data-model-decisions.md §1.7 and §4.3 that PostgreSQL can enforce
-- but Prisma's schema language cannot express: CHECK constraints and
-- triggers. Each block cites the rule it implements. Prisma does not manage
-- these objects — `prisma db pull` will not reproduce them, and they will
-- not appear in `prisma/schema.prisma` — but a normal `prisma migrate dev`
-- for a *later* schema change does not touch them either, because Prisma's
-- diffing is driven by the models in schema.prisma, not by introspecting
-- triggers/check constraints it does not manage. Still: review any future
-- generated migration (`prisma migrate dev --create-only`) before applying
-- it, to confirm nothing in Part 2 was disturbed.

-- ============================================================================
-- PART 1 — generated from prisma/schema.prisma (do not hand-edit this part)
-- ============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "article_publication_status" AS ENUM ('NEVER_PUBLISHED', 'LIVE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "revision_state" AS ENUM ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "review_decision_type" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "deactivated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "article_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" UUID NOT NULL,
    "verified_by_user_id" UUID,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "byline_override" TEXT,
    "publication_status" "article_publication_status" NOT NULL DEFAULT 'NEVER_PUBLISHED',
    "current_published_revision_id" UUID,
    "published_at" TIMESTAMP(3),
    "first_published_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_revisions" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "state" "revision_state" NOT NULL,
    "open_marker" BOOLEAN,
    "published_marker" BOOLEAN,
    "headline" TEXT,
    "summary" TEXT,
    "body" JSONB,
    "body_plain" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "featured_image_id" UUID,
    "featured_image_alt" TEXT,
    "featured_image_credit" TEXT,
    "featured_image_caption" TEXT,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "published_by_user_id" UUID,
    "archived_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "article_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_sources" (
    "id" UUID NOT NULL,
    "article_revision_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_decisions" (
    "id" UUID NOT NULL,
    "article_revision_id" UUID NOT NULL,
    "decision" "review_decision_type" NOT NULL,
    "comment" TEXT,
    "decided_by_user_id" UUID NOT NULL,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "uploaded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_article_id_created_at_idx" ON "audit_logs"("article_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_current_published_revision_id_key" ON "articles"("current_published_revision_id");

-- CreateIndex
CREATE INDEX "articles_publication_status_published_at_idx" ON "articles"("publication_status", "published_at");

-- CreateIndex
CREATE INDEX "articles_category_id_publication_status_published_at_idx" ON "articles"("category_id", "publication_status", "published_at");

-- CreateIndex
CREATE INDEX "articles_owner_id_idx" ON "articles"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "articles_current_published_revision_id_id_key" ON "articles"("current_published_revision_id", "id");

-- CreateIndex
CREATE INDEX "article_revisions_article_id_created_at_idx" ON "article_revisions"("article_id", "created_at");

-- CreateIndex
CREATE INDEX "article_revisions_state_submitted_at_idx" ON "article_revisions"("state", "submitted_at");

-- CreateIndex
CREATE INDEX "article_revisions_created_by_user_id_idx" ON "article_revisions"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_revisions_id_article_id_key" ON "article_revisions"("id", "article_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_revisions_article_id_open_marker_key" ON "article_revisions"("article_id", "open_marker");

-- CreateIndex
CREATE UNIQUE INDEX "article_revisions_article_id_published_marker_key" ON "article_revisions"("article_id", "published_marker");

-- CreateIndex
CREATE INDEX "article_sources_article_revision_id_position_idx" ON "article_sources"("article_revision_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "article_sources_article_revision_id_source_id_key" ON "article_sources"("article_revision_id", "source_id");

-- CreateIndex
CREATE INDEX "review_decisions_article_revision_id_decided_at_idx" ON "review_decisions"("article_revision_id", "decided_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_current_published_revision_id_id_fkey" FOREIGN KEY ("current_published_revision_id", "id") REFERENCES "article_revisions"("id", "article_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_featured_image_id_fkey" FOREIGN KEY ("featured_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_published_by_user_id_fkey" FOREIGN KEY ("published_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_sources" ADD CONSTRAINT "article_sources_article_revision_id_fkey" FOREIGN KEY ("article_revision_id") REFERENCES "article_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_sources" ADD CONSTRAINT "article_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_article_revision_id_fkey" FOREIGN KEY ("article_revision_id") REFERENCES "article_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- PART 2 — hand-written safeguards (not managed by Prisma's schema language)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1  BR-09 — submit requires headline, summary and body present.
--      A revision may be incomplete only while it is still a DRAFT.
-- ----------------------------------------------------------------------------
ALTER TABLE "article_revisions"
  ADD CONSTRAINT "article_revisions_completeness_outside_draft_check"
  CHECK (
    "state" = 'DRAFT'
    OR (
      "headline" IS NOT NULL AND length(trim("headline")) > 0
      AND "summary" IS NOT NULL AND length(trim("summary")) > 0
      AND "body" IS NOT NULL
    )
  );

-- ----------------------------------------------------------------------------
-- 2.2  BR-07 / BR-08 — request-changes and reject require non-empty text.
-- ----------------------------------------------------------------------------
ALTER TABLE "review_decisions"
  ADD CONSTRAINT "review_decisions_reason_required_check"
  CHECK (
    "decision" NOT IN ('CHANGES_REQUESTED', 'REJECTED')
    OR ("comment" IS NOT NULL AND length(trim("comment")) > 0)
  );

-- ----------------------------------------------------------------------------
-- 2.3  A11Y-03 / SEO-12 — a featured image requires alt text before it can
--      be attached to a revision.
-- ----------------------------------------------------------------------------
ALTER TABLE "article_revisions"
  ADD CONSTRAINT "article_revisions_featured_image_alt_required_check"
  CHECK (
    "featured_image_id" IS NULL
    OR ("featured_image_alt" IS NOT NULL AND length(trim("featured_image_alt")) > 0)
  );

-- ----------------------------------------------------------------------------
-- 2.4  I-4 — publication_status = LIVE if and only if
--      current_published_revision_id IS NOT NULL. One predicate (DM-03),
--      structurally impossible to violate.
-- ----------------------------------------------------------------------------
ALTER TABLE "articles"
  ADD CONSTRAINT "articles_live_status_matches_pointer_check"
  CHECK (("publication_status" = 'LIVE') = ("current_published_revision_id" IS NOT NULL));

-- ----------------------------------------------------------------------------
-- 2.5  I-1 / I-2 — derive open_marker / published_marker from state on every
--      write, so application code never has to and the two columns can
--      never drift out of sync with it. The partial-uniqueness invariants
--      themselves are the ordinary unique indexes already created in Part 1
--      (article_revisions_article_id_open_marker_key,
--      article_revisions_article_id_published_marker_key) — PostgreSQL does
--      not count NULLs against a unique index, so this is a full substitute
--      for a native partial unique index (which Prisma's schema language
--      cannot express).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_revision_markers() RETURNS TRIGGER AS $$
BEGIN
  NEW.open_marker := CASE
    WHEN NEW.state IN ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED') THEN TRUE
    ELSE NULL
  END;
  NEW.published_marker := CASE WHEN NEW.state = 'PUBLISHED' THEN TRUE ELSE NULL END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_article_revisions_sync_markers
  BEFORE INSERT OR UPDATE ON "article_revisions"
  FOR EACH ROW
  EXECUTE FUNCTION sync_revision_markers();

-- ----------------------------------------------------------------------------
-- 2.6  I-5 — BR-15: slug is unique (Part 1) and immutable once the article
--      has first been published. first_published_at is set once by the
--      transition service on T10 and never cleared or changed again.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_slug_immutable_after_publish() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.first_published_at IS NOT NULL AND NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'articles.slug is immutable once an article has first been published (BR-15)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_slug_immutable
  BEFORE UPDATE ON "articles"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_slug_immutable_after_publish();

-- ----------------------------------------------------------------------------
-- 2.7  BR-14 — at least one active admin must always exist. A deferred
--      constraint trigger, so multiple changes inside one transaction
--      (e.g. promote a new admin, then demote the old one) are only
--      checked once, at COMMIT.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_at_least_one_active_admin() RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "users" WHERE "role" = 'ADMIN' AND "status" = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'at least one active admin must exist at all times (BR-14)';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_users_at_least_one_active_admin
  AFTER UPDATE OR DELETE ON "users"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_at_least_one_active_admin();

-- ----------------------------------------------------------------------------
-- 2.8  P2-21 — a category cannot be deactivated (soft-deleted) while a LIVE
--      article still references it.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_category_not_deactivated_while_live() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM "articles"
      WHERE "category_id" = OLD.id AND "publication_status" = 'LIVE' AND "deleted_at" IS NULL
    ) THEN
      RAISE EXCEPTION 'category cannot be deactivated while a published article references it (P2-21)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_no_deactivate_while_live
  BEFORE UPDATE ON "categories"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_category_not_deactivated_while_live();

-- ----------------------------------------------------------------------------
-- 2.9  DM-06 / BR-13 — an admin may not approve or publish an article they
--      own or last revised. The application (the transition service,
--      docs/23 §8.5 Flow 10) is the primary enforcement point and is
--      expected to refuse the action before it ever reaches the database.
--      These two triggers are defense-in-depth for the single most
--      security-sensitive rule in the product (docs/26 §2.2): they make the
--      violation structurally impossible even if the application check is
--      ever bypassed, skipped, or has a bug.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_no_self_approval() RETURNS TRIGGER AS $$
DECLARE
  v_article_owner_id UUID;
  v_revision_author_id UUID;
BEGIN
  IF NEW.decision = 'APPROVED' THEN
    SELECT a."owner_id", r."created_by_user_id"
      INTO v_article_owner_id, v_revision_author_id
      FROM "article_revisions" r
      JOIN "articles" a ON a."id" = r."article_id"
      WHERE r."id" = NEW.article_revision_id;

    IF NEW.decided_by_user_id = v_article_owner_id OR NEW.decided_by_user_id = v_revision_author_id THEN
      RAISE EXCEPTION 'an admin may not approve an article they own or last revised (BR-13)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_decisions_no_self_approval
  BEFORE INSERT ON "review_decisions"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_no_self_approval();

CREATE OR REPLACE FUNCTION enforce_no_self_publish() RETURNS TRIGGER AS $$
DECLARE
  v_article_owner_id UUID;
BEGIN
  IF NEW.state = 'PUBLISHED' AND (OLD.state IS DISTINCT FROM 'PUBLISHED') AND NEW.published_by_user_id IS NOT NULL THEN
    SELECT "owner_id" INTO v_article_owner_id FROM "articles" WHERE "id" = NEW.article_id;

    IF NEW.published_by_user_id = v_article_owner_id OR NEW.published_by_user_id = NEW.created_by_user_id THEN
      RAISE EXCEPTION 'an admin may not publish an article they own or authored this revision of (BR-13)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_article_revisions_no_self_publish
  BEFORE UPDATE ON "article_revisions"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_no_self_publish();

-- ----------------------------------------------------------------------------
-- 2.10  DM-10 / SEC-11 — audit_logs is append-only: INSERT and SELECT only.
--       DM-10 asks for this "at the database privilege level" (GRANT/REVOKE
--       on a dedicated runtime role). That role does not exist yet — no
--       deployment topology or connection-role convention has been decided
--       for this project (out of scope for Phase 4B). Until it is, these
--       triggers give the equivalent guarantee for every role, including
--       the table owner, which plain privilege grants would NOT cover.
--       When a restricted runtime role is introduced, ALSO run:
--         REVOKE UPDATE, DELETE ON "audit_logs" FROM <app_runtime_role>;
--       as pure defense-in-depth layered under these triggers, not instead
--       of them.
--
--       docs/26 §4.1 also documents ReviewDecision as immutable — the same
--       protection is applied to review_decisions below.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '% on % is not permitted: this table is append-only (SEC-11)', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_no_update
  BEFORE UPDATE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER trg_audit_logs_no_delete
  BEFORE DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER trg_review_decisions_no_update
  BEFORE UPDATE ON "review_decisions"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER trg_review_decisions_no_delete
  BEFORE DELETE ON "review_decisions"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

-- ----------------------------------------------------------------------------
-- 2.11  P2-23 — optimistic concurrency. version is auto-incremented on every
--       UPDATE so application code only ever needs to read the current
--       value and assert it in the WHERE clause of its transition update
--       (`WHERE id = ? AND version = ?`); it never sets version itself.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION bump_version() RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_bump_version
  BEFORE UPDATE ON "articles"
  FOR EACH ROW EXECUTE FUNCTION bump_version();

CREATE TRIGGER trg_article_revisions_bump_version
  BEFORE UPDATE ON "article_revisions"
  FOR EACH ROW EXECUTE FUNCTION bump_version();
