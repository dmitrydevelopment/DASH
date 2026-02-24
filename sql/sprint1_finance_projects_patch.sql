-- Sprint 1 patch: projects for status board (3-column layout)

CREATE TABLE IF NOT EXISTS `finance_projects` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `work_items_json` mediumtext COLLATE utf8mb4_unicode_ci,
  `status` enum('in_work','ready_to_invoice') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_work',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_finance_projects_client` (`client_id`),
  KEY `idx_finance_projects_status` (`status`),
  CONSTRAINT `fk_finance_projects_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
