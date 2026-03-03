-- Add legal address field for clients.
-- Safe re-run: checks column existence before ALTER.

SET @has_legal_address := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'clients'
    AND column_name = 'legal_address'
);

SET @sql := IF(
  @has_legal_address = 0,
  'ALTER TABLE `clients` ADD COLUMN `legal_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `legal_name`',
  'SELECT ''skip add clients.legal_address'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'clients'
  AND column_name = 'legal_address';
