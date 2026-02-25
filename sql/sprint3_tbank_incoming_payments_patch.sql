-- Sprint 3 patch: incoming payments from T-Bank (push+pull)
-- Idempotent schema alignment for finance_bank_operations + finance_sync_state.

-- 1) finance_bank_operations: required columns for incoming registry + matching.
SET @db_name := DATABASE();

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND column_name = 'operation_time'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD COLUMN operation_time DATETIME NULL AFTER operation_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND column_name = 'account_number'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD COLUMN account_number VARCHAR(22) NULL AFTER currency'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND column_name = 'description'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD COLUMN description TEXT NULL AFTER account_number'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND column_name = 'counterparty_name'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD COLUMN counterparty_name VARCHAR(255) NULL AFTER description'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND column_name = 'counterparty_inn'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD COLUMN counterparty_inn VARCHAR(12) NULL AFTER counterparty_name'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND column_name = 'matched_document_id'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD COLUMN matched_document_id INT UNSIGNED NULL AFTER raw_json'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND column_name = 'match_method'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD COLUMN match_method VARCHAR(32) NULL AFTER matched_document_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND column_name = 'matched_at'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD COLUMN matched_at DATETIME NULL AFTER match_method'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) finance_sync_state: cursor fields used by sync cron.
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_sync_state' AND column_name = 'tbank_cursor'
    ),
    'SELECT 1',
    'ALTER TABLE finance_sync_state ADD COLUMN tbank_cursor VARCHAR(100) NULL AFTER id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_sync_state' AND column_name = 'last_run_at'
    ),
    'SELECT 1',
    'ALTER TABLE finance_sync_state ADD COLUMN last_run_at DATETIME NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = @db_name AND table_name = 'finance_sync_state' AND column_name = 'last_error'
    ),
    'SELECT 1',
    'ALTER TABLE finance_sync_state ADD COLUMN last_error TEXT NULL AFTER last_run_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Indexes for critical lookups.
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND index_name = 'idx_operation_time'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD INDEX idx_operation_time (operation_time)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND index_name = 'idx_counterparty_inn'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD INDEX idx_counterparty_inn (counterparty_inn)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = @db_name AND table_name = 'finance_bank_operations' AND index_name = 'idx_matched_document_id'
    ),
    'SELECT 1',
    'ALTER TABLE finance_bank_operations ADD INDEX idx_matched_document_id (matched_document_id)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'sprint3_tbank_incoming_payments_patch applied' AS result;
