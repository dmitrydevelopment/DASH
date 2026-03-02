-- Sprint 4 patch: failure-only log for invoice send attempts.
-- Stores only failed channel attempts; successful sends are not logged here.

SET @db_name := DATABASE();

CREATE TABLE IF NOT EXISTS finance_send_failures (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  document_id INT UNSIGNED NULL,
  invoice_plan_id INT UNSIGNED NULL,
  channel ENUM('email','telegram','diadoc') NOT NULL,
  error_code VARCHAR(64) NULL,
  error_message TEXT NULL,
  attempt_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_send_failures_document_created (document_id, created_at),
  KEY idx_send_failures_plan_created (invoice_plan_id, created_at),
  KEY idx_send_failures_channel_created (channel, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @idx_doc_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = @db_name
    AND table_name = 'finance_send_failures'
    AND index_name = 'idx_send_failures_document_created'
);
SET @sql := IF(
  @idx_doc_exists = 0,
  'ALTER TABLE finance_send_failures ADD INDEX idx_send_failures_document_created (document_id, created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_plan_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = @db_name
    AND table_name = 'finance_send_failures'
    AND index_name = 'idx_send_failures_plan_created'
);
SET @sql := IF(
  @idx_plan_exists = 0,
  'ALTER TABLE finance_send_failures ADD INDEX idx_send_failures_plan_created (invoice_plan_id, created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_channel_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = @db_name
    AND table_name = 'finance_send_failures'
    AND index_name = 'idx_send_failures_channel_created'
);
SET @sql := IF(
  @idx_channel_exists = 0,
  'ALTER TABLE finance_send_failures ADD INDEX idx_send_failures_channel_created (channel, created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'sprint4_send_failures_log_patch applied' AS result;
