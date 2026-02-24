-- Sprint 1 patch: project status dictionary + migration to new status codes

CREATE TABLE IF NOT EXISTS `finance_project_statuses` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '100',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_finance_project_statuses_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `finance_project_statuses` (`code`, `name`, `sort_order`, `is_active`)
VALUES
  ('in_progress', 'В работе', 10, 1),
  ('to_pay', 'Выставить счет', 20, 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `sort_order` = VALUES(`sort_order`),
  `is_active` = VALUES(`is_active`);

ALTER TABLE `finance_projects`
  MODIFY COLUMN `status` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_progress';

UPDATE `finance_projects` SET `status` = 'in_progress' WHERE `status` IN ('in_work');
UPDATE `finance_projects` SET `status` = 'to_pay' WHERE `status` IN ('ready_to_invoice');
