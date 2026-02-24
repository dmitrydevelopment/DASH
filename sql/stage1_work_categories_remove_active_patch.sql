-- Stage 1 follow-up: remove activity flag from work categories

ALTER TABLE `work_categories`
  DROP INDEX `idx_work_category_active_sort`;

ALTER TABLE `work_categories`
  DROP COLUMN `is_active`;
