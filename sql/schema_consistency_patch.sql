-- Schema consistency patch: active flag contract for clients + finance cron
-- Contract used by application and cron jobs: clients.is_active = 1 means active record.

-- If column is missing on legacy environments, add it.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1;

-- Optional one-time backfill for environments where soft-delete was used before:
-- update active status based on legacy is_deleted when present.
-- UPDATE clients SET is_active = CASE WHEN is_deleted = 1 THEN 0 ELSE 1 END;

-- Optional: keep only one contract in app code (is_active).
-- You can remove legacy column manually after verification:
-- ALTER TABLE clients DROP COLUMN is_deleted;
