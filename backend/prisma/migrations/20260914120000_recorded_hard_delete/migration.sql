-- OQ-12 resolved as option (c): soft delete by default, with a rare,
-- deliberate, RECORDED hard delete of an article (docs/05 §OQ-12,
-- docs/03 "Delete permanently" — admin only).
--
-- Deleting an article row touches two append-only tables (init migration
-- §2.10), which is why it was impossible until now:
--
--   1. audit_logs.article_id is ON DELETE SET NULL — PostgreSQL performs
--      that as an UPDATE on audit_logs, and trg_audit_logs_no_update
--      refused it. The rows themselves are never removed: the trail of
--      who did what to the story stays, keyed by entity_id, with the
--      article pointer cleared because the row it pointed at is gone.
--   2. review_decisions RESTRICT the revisions they were made on, and
--      trg_review_decisions_no_delete refused removing them.
--
-- prevent_mutation() therefore now admits exactly two things, and only
-- while the transaction has declared itself an article purge by setting
-- the custom GUC today_news.purge_article = 'on' (SET LOCAL — scoped to
-- that transaction, never the connection; articles.service.ts
-- deleteArticlePermanently is the only place that sets it):
--
--   * UPDATE audit_logs where the ONLY change is article_id becoming NULL
--     (every other column compared unchanged) — i.e. the FK action;
--   * DELETE review_decisions.
--
-- Everything else — any other UPDATE on audit_logs, any DELETE of an
-- audit row, any UPDATE of a review decision — is refused exactly as
-- before, purge flag or not. SEC-11's guarantee is unchanged for every
-- ordinary code path; the purge itself writes its own audit row
-- (action DELETE on entity Article) after the article is gone.

CREATE OR REPLACE FUNCTION prevent_mutation() RETURNS TRIGGER AS $$
DECLARE
  purging BOOLEAN := COALESCE(current_setting('today_news.purge_article', true), '') = 'on';
BEGIN
  IF purging AND TG_TABLE_NAME = 'audit_logs' AND TG_OP = 'UPDATE' THEN
    IF NEW.article_id IS NULL
       AND OLD.article_id IS NOT NULL
       AND NEW.id = OLD.id
       AND NEW.actor_user_id IS NOT DISTINCT FROM OLD.actor_user_id
       AND NEW.entity_type = OLD.entity_type
       AND NEW.entity_id = OLD.entity_id
       AND NEW.action = OLD.action
       AND NEW.metadata IS NOT DISTINCT FROM OLD.metadata
       AND NEW.created_at = OLD.created_at THEN
      RETURN NEW;
    END IF;
  END IF;

  IF purging AND TG_TABLE_NAME = 'review_decisions' AND TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RAISE EXCEPTION '% on % is not permitted: this table is append-only (SEC-11)', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
