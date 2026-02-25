-- Sprint 3 patch: explicit invoice source type in invoice_plans.
-- Purpose: reliable support/project filtering without doc_number heuristics.

SET @db_name = DATABASE();

-- 1) Add source_type column if missing.
SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db_name
        AND table_name = 'invoice_plans'
        AND column_name = 'source_type'
    ),
    'SELECT 1',
    "ALTER TABLE invoice_plans
       ADD COLUMN source_type ENUM('support','project') NOT NULL DEFAULT 'support'
       AFTER status"
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Add index for filter performance.
SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = @db_name
        AND table_name = 'invoice_plans'
        AND index_name = 'idx_invoice_plans_source_type'
    ),
    'SELECT 1',
    'ALTER TABLE invoice_plans ADD INDEX idx_invoice_plans_source_type (source_type)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Backfill existing rows:
-- project only when there is an explicit project mapping;
-- all others remain support.
-- Current dataset does not contain persistent project linkage for old plans,
-- so defaulting to support avoids false "project" classification.
UPDATE invoice_plans
SET source_type = 'support'
WHERE source_type IS NULL OR source_type = '';

SELECT 'sprint3_invoice_plan_source_type_patch applied' AS status;
