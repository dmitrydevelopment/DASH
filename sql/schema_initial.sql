-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Фев 08 2026 г., 19:13
-- Версия сервера: 5.7.21-20-beget-5.7.21-20-1-log
-- Версия PHP: 5.6.40

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `kostyasw_dash`
--

-- --------------------------------------------------------

--
-- Структура таблицы `clients`
--
-- Создание: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `legal_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inn` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kpp` varchar(9) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_employee_id` int(10) UNSIGNED DEFAULT NULL,
  `tracker_project_id` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `client_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'support',
  `send_invoice_schedule` tinyint(1) NOT NULL DEFAULT '0',
  `invoice_use_end_month_date` tinyint(1) NOT NULL DEFAULT '0',
  `send_invoice_telegram` tinyint(1) NOT NULL DEFAULT '0',
  `send_invoice_diadoc` tinyint(1) NOT NULL DEFAULT '0',
  `send_act_diadoc` tinyint(1) NOT NULL DEFAULT '0',
  `telegram_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chat_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diadoc_box_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diadoc_department_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `client_act_items`
--
-- Создание: Дек 22 2025 г., 15:59
-- Последнее обновление: Фев 08 2026 г., 15:25
--

DROP TABLE IF EXISTS `client_act_items`;
CREATE TABLE `client_act_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `client_invoice_items`
--
-- Создание: Дек 22 2025 г., 15:59
-- Последнее обновление: Фев 08 2026 г., 15:25
--

DROP TABLE IF EXISTS `client_invoice_items`;
CREATE TABLE `client_invoice_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `crm_employee_roles`
--
-- Создание: Дек 23 2025 г., 13:27
-- Последнее обновление: Фев 08 2026 г., 15:24
--

DROP TABLE IF EXISTS `crm_employee_roles`;
CREATE TABLE `crm_employee_roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `role_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_tag` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Структура таблицы `work_categories`
--
-- Создание: Фев 22 2026 г., 18:00
--

DROP TABLE IF EXISTS `work_categories`;
CREATE TABLE `work_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT '100',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `crm_settings`
--
-- Создание: Фев 08 2026 г., 14:02
-- Последнее обновление: Фев 08 2026 г., 15:24
--

DROP TABLE IF EXISTS `crm_settings`;
CREATE TABLE `crm_settings` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `tinkoff_business_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `dadata_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `scheduler_start_hour` tinyint(3) UNSIGNED NOT NULL DEFAULT '9',
  `crm_public_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_telegram_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_tbank_account_number` varchar(22) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_tbank_invoice_due_days` int(10) UNSIGNED NOT NULL DEFAULT '3',
  `finance_tbank_unit_default` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'шт',
  `finance_tbank_vat_default` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'None',
  `finance_tbank_payment_purpose_template` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_from_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_from_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_subject_invoice` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_subject_act` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_email_body_invoice_html` mediumtext COLLATE utf8mb4_unicode_ci,
  `finance_email_body_act_html` mediumtext COLLATE utf8mb4_unicode_ci,
  `finance_email_bcc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_telegram_bot_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegram_default_message_invoice` mediumtext COLLATE utf8mb4_unicode_ci,
  `finance_diadoc_api_client_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_diadoc_login` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_diadoc_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finance_diadoc_from_box_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `employees`
--
-- Создание: Дек 20 2025 г., 12:42
--

DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `telegram_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_on_vacation` tinyint(1) NOT NULL DEFAULT '0',
  `salary_monthly` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `skills_raw` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `employee_salary_history`
--
-- Создание: Дек 20 2025 г., 13:37
--

DROP TABLE IF EXISTS `employee_salary_history`;
CREATE TABLE `employee_salary_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `amount` int(11) NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Структура таблицы `employee_schedule`
--
-- Создание: Дек 20 2025 г., 11:06
--

DROP TABLE IF EXISTS `employee_schedule`;
CREATE TABLE `employee_schedule` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `weekday` tinyint(3) UNSIGNED NOT NULL COMMENT '1=Пн ... 7=Вс',
  `is_working` tinyint(1) NOT NULL DEFAULT '0',
  `hour_from` tinyint(3) UNSIGNED DEFAULT NULL,
  `hour_to` tinyint(3) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_bank_operations`
--
-- Создание: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_bank_operations`;

-- --------------------------------------------------------

--
-- Структура таблицы `invoice_plans`
--

DROP TABLE IF EXISTS `invoice_plans`;
CREATE TABLE `invoice_plans` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `period_year` smallint(5) UNSIGNED NOT NULL,
  `period_month` tinyint(3) UNSIGNED NOT NULL,
  `period_label` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('planned','sent_waiting_payment','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `work_items_json` mediumtext COLLATE utf8mb4_unicode_ci,
  `channels_json` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_id` int(10) UNSIGNED DEFAULT NULL,
  `planned_send_date` date DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `finance_bank_operations` (
  `id` int(10) UNSIGNED NOT NULL,
  `operation_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operation_time` datetime DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(22) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `counterparty_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counterparty_inn` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_json` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `matched_document_id` int(10) UNSIGNED DEFAULT NULL,
  `match_method` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `matched_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_documents`
--
-- Создание: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_documents`;
CREATE TABLE `finance_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `doc_type` enum('invoice','act') COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `period_year` smallint(5) UNSIGNED NOT NULL,
  `period_month` tinyint(3) UNSIGNED NOT NULL,
  `doc_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `doc_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_sum` decimal(12,2) NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RUB',
  `file_rel_path` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(10) UNSIGNED DEFAULT NULL,
  `file_sha256` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `download_token` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tbank_invoice_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tbank_pdf_url` text COLLATE utf8mb4_unicode_ci,
  `tbank_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tbank_created_at` datetime DEFAULT NULL,
  `diadoc_message_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diadoc_entity_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  `paid_sum` decimal(12,2) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `last_payment_check_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_download_events`
--
-- Создание: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_download_events`;
CREATE TABLE `finance_download_events` (
  `id` int(10) UNSIGNED NOT NULL,
  `document_id` int(10) UNSIGNED NOT NULL,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_send_events`
--
-- Создание: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_send_events`;
CREATE TABLE `finance_send_events` (
  `id` int(10) UNSIGNED NOT NULL,
  `document_id` int(10) UNSIGNED NOT NULL,
  `channel` enum('email','telegram','diadoc') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `recipient_hash` char(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','success','failed','skipped') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `attempts` tinyint(3) UNSIGNED NOT NULL DEFAULT '0',
  `last_attempt_at` datetime DEFAULT NULL,
  `success_at` datetime DEFAULT NULL,
  `last_error` text COLLATE utf8mb4_unicode_ci,
  `response_json` longtext COLLATE utf8mb4_unicode_ci,
  `open_token` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opened_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `finance_sync_state`
--
-- Создание: Фев 08 2026 г., 14:02
-- Последнее обновление: Фев 08 2026 г., 14:02
--

DROP TABLE IF EXISTS `finance_sync_state`;
CREATE TABLE `finance_sync_state` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `tbank_cursor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_from_utc` datetime DEFAULT NULL,
  `last_to_utc` datetime DEFAULT NULL,
  `last_run_at` datetime DEFAULT NULL,
  `last_error` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--
-- Создание: Дек 08 2025 г., 09:34
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `login` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','employee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'employee',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_clients_is_active` (`is_active`),
  ADD KEY `idx_clients_manager_employee_id` (`manager_employee_id`),
  ADD KEY `idx_clients_tracker_project_id` (`tracker_project_id`),
  ADD KEY `idx_clients_inn` (`inn`),
  ADD KEY `idx_clients_kpp` (`kpp`),
  ADD KEY `idx_clients_client_type` (`client_type`),
  ADD KEY `idx_clients_send_invoice_schedule` (`send_invoice_schedule`),
  ADD KEY `idx_clients_send_invoice_diadoc` (`send_invoice_diadoc`),
  ADD KEY `idx_clients_send_act_diadoc` (`send_act_diadoc`);

--
-- Индексы таблицы `client_act_items`
--
ALTER TABLE `client_act_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cai_client_id` (`client_id`);

--
-- Индексы таблицы `client_invoice_items`
--
ALTER TABLE `client_invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cii_client_id` (`client_id`);

--
-- Индексы таблицы `crm_employee_roles`
--
ALTER TABLE `crm_employee_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_role_tag` (`role_tag`),
  ADD KEY `idx_sort` (`sort_order`);


--
-- Индексы таблицы `work_categories`
--
ALTER TABLE `work_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_work_category_tag` (`tag`),
  ADD KEY `idx_work_category_sort` (`sort_order`,`id`);

--
-- Индексы таблицы `crm_settings`
--
ALTER TABLE `crm_settings`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employees_user_id` (`user_id`);

--
-- Индексы таблицы `employee_salary_history`
--
ALTER TABLE `employee_salary_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_changed` (`employee_id`,`changed_at`);

--
-- Индексы таблицы `employee_schedule`
--
ALTER TABLE `employee_schedule`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_employee_weekday` (`employee_id`,`weekday`);

--
-- Индексы таблицы `finance_bank_operations`
--
ALTER TABLE `invoice_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_invoice_plans_status` (`status`),
  ADD KEY `idx_invoice_plans_period` (`period_year`,`period_month`),
  ADD KEY `idx_invoice_plans_client` (`client_id`),
  ADD KEY `idx_invoice_plans_document` (`document_id`);

ALTER TABLE `finance_bank_operations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_operation_id` (`operation_id`),
  ADD KEY `idx_time` (`operation_time`),
  ADD KEY `idx_matched` (`matched_document_id`,`matched_at`);

--
-- Индексы таблицы `finance_documents`
--
ALTER TABLE `finance_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_doc_period` (`doc_type`,`client_id`,`period_year`,`period_month`),
  ADD UNIQUE KEY `uniq_download_token` (`download_token`),
  ADD KEY `idx_client_period` (`client_id`,`period_year`,`period_month`),
  ADD KEY `idx_doc_number` (`doc_number`),
  ADD KEY `idx_paid` (`is_paid`,`paid_at`);

--
-- Индексы таблицы `finance_download_events`
--
ALTER TABLE `finance_download_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_doc_time` (`document_id`,`requested_at`);

--
-- Индексы таблицы `finance_send_events`
--
ALTER TABLE `finance_send_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_doc_channel_recipient` (`document_id`,`channel`,`recipient_hash`),
  ADD UNIQUE KEY `uniq_open_token` (`open_token`),
  ADD KEY `idx_status_attempts` (`status`,`attempts`),
  ADD KEY `idx_doc` (`document_id`);

--
-- Индексы таблицы `finance_sync_state`
--
ALTER TABLE `finance_sync_state`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_users_login` (`login`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `client_act_items`
--
ALTER TABLE `client_act_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `client_invoice_items`
--
ALTER TABLE `client_invoice_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `crm_employee_roles`
--
ALTER TABLE `crm_employee_roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `employee_salary_history`
--
ALTER TABLE `employee_salary_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `employee_schedule`
--
ALTER TABLE `employee_schedule`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `finance_bank_operations`
--
ALTER TABLE `finance_bank_operations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `finance_documents`
--
ALTER TABLE `finance_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `finance_download_events`
--
ALTER TABLE `finance_download_events`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `finance_send_events`
--
ALTER TABLE `finance_send_events`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;


--
-- AUTO_INCREMENT для таблицы `work_categories`
--
ALTER TABLE `work_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `invoice_plans`
--
ALTER TABLE `invoice_plans`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `client_act_items`
--
ALTER TABLE `client_act_items`
  ADD CONSTRAINT `fk_cai_client_id` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `client_invoice_items`
--
ALTER TABLE `client_invoice_items`
  ADD CONSTRAINT `fk_cii_client_id` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `invoice_plans`
--
ALTER TABLE `invoice_plans`
  ADD CONSTRAINT `fk_invoice_plans_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `employee_salary_history`
--
ALTER TABLE `employee_salary_history`
  ADD CONSTRAINT `fk_salary_hist_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `employee_schedule`
--
ALTER TABLE `employee_schedule`
  ADD CONSTRAINT `fk_employee_schedule_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
