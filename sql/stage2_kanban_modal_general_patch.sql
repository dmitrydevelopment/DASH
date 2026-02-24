ALTER TABLE `invoice_plans`
  ADD COLUMN `planned_send_date` date DEFAULT NULL AFTER `document_id`;

ALTER TABLE `crm_settings`
  ADD COLUMN `admin_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `crm_public_url`,
  ADD COLUMN `admin_telegram_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `admin_email`;
