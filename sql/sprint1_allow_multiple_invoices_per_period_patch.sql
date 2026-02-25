-- Allow multiple invoices/cards for the same client and month.
-- This keeps old sent invoices visible in the "sent_waiting_payment" column.

SET @db_name := DATABASE();

-- invoice_plans: ensure FK-supporting index on client_id exists.
SELECT COUNT(*) INTO @has_idx_invoice_plans_client
FROM information_schema.statistics
WHERE table_schema = @db_name
  AND table_name = 'invoice_plans'
  AND index_name = 'idx_invoice_plans_client';

SET @sql := IF(
  @has_idx_invoice_plans_client = 0,
  'ALTER TABLE `invoice_plans` ADD KEY `idx_invoice_plans_client` (`client_id`)',
  'SELECT ''skip add idx_invoice_plans_client'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- invoice_plans: drop unique client+period key if present.
SELECT COUNT(*) INTO @has_uniq_plan_period
FROM information_schema.statistics
WHERE table_schema = @db_name
  AND table_name = 'invoice_plans'
  AND index_name = 'uniq_plan_period';

SET @sql := IF(
  @has_uniq_plan_period > 0,
  'ALTER TABLE `invoice_plans` DROP INDEX `uniq_plan_period`',
  'SELECT ''skip drop uniq_plan_period'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- finance_documents: drop unique doc_type+client+period key if present.
SELECT COUNT(*) INTO @has_uniq_doc_period
FROM information_schema.statistics
WHERE table_schema = @db_name
  AND table_name = 'finance_documents'
  AND index_name = 'uniq_doc_period';

SET @sql := IF(
  @has_uniq_doc_period > 0,
  'ALTER TABLE `finance_documents` DROP INDEX `uniq_doc_period`',
  'SELECT ''skip drop uniq_doc_period'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Keep non-unique lookup index for fast board/filter queries.
SELECT COUNT(*) INTO @has_idx_client_period
FROM information_schema.statistics
WHERE table_schema = @db_name
  AND table_name = 'finance_documents'
  AND index_name = 'idx_client_period';

SET @sql := IF(
  @has_idx_client_period = 0,
  'ALTER TABLE `finance_documents` ADD KEY `idx_client_period` (`client_id`,`period_year`,`period_month`)',
  'SELECT ''skip add idx_client_period'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
