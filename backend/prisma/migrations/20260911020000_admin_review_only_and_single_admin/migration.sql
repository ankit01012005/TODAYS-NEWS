-- Reverses the "admin can also write" model (docs/03 §2.3, superseded) in
-- favour of a strict split: editors author, admin only reviews and manages.
-- Two consequences, both in this migration:
--
--   1. An admin can no longer own or author an article, so BR-13
--      (self-approval) is now structurally impossible. Its two
--      defense-in-depth triggers (init migration §2.9) are dropped rather
--      than kept as dead code that can never fire.
--
--   2. BR-14 ("at least one active admin must exist", init migration §2.7)
--      is joined by its mirror: at MOST one active admin may exist. Together
--      they mean exactly one active admin at all times. Same deferred
--      constraint trigger shape as the existing BR-14 trigger, so multiple
--      changes inside one transaction (e.g. promote the replacement, then
--      demote the old admin) are only checked once, at COMMIT — but this one
--      must also fire on INSERT: users.service.invite() creates a new user
--      with status ACTIVE immediately (their password is a placeholder until
--      the invitation is accepted), so inviting a second admin is exactly as
--      dangerous as promoting one.

-- ----------------------------------------------------------------------------
-- Drop BR-13 (self-approval) — unreachable now that admin never authors.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_review_decisions_no_self_approval ON "review_decisions";
DROP TRIGGER IF EXISTS trg_article_revisions_no_self_publish ON "article_revisions";
DROP FUNCTION IF EXISTS enforce_no_self_approval();
DROP FUNCTION IF EXISTS enforce_no_self_publish();

-- ----------------------------------------------------------------------------
-- BR-14 (extended) — at most one active admin, mirroring the existing
-- "at least one" trigger.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_at_most_one_active_admin() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM "users" WHERE "role" = 'ADMIN' AND "status" = 'ACTIVE') > 1 THEN
    RAISE EXCEPTION 'at most one active admin may exist at a time (BR-14)';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_users_at_most_one_active_admin
  AFTER INSERT OR UPDATE ON "users"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_at_most_one_active_admin();
