-- Sprint 2: ensure settings column for monthly finance expense exists.
-- Idempotent patch for MySQL 5.7+/8.0.

SET @db_name := DATABASE();
SET @exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'crm_settings'
    AND COLUMN_NAME = 'finance_total_expense'
);

SET @sql := IF(
  @exists = 0,
  'ALTER TABLE crm_settings ADD COLUMN finance_total_expense DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER finance_act_number_prefix',
  'SELECT ''finance_total_expense already exists'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
