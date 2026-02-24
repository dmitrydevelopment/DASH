CREATE TABLE IF NOT EXISTS `invoice_plans` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` int(10) UNSIGNED NOT NULL,
  `period_year` smallint(5) UNSIGNED NOT NULL,
  `period_month` tinyint(3) UNSIGNED NOT NULL,
  `period_label` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('planned','sent_waiting_payment','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `work_items_json` mediumtext COLLATE utf8mb4_unicode_ci,
  `channels_json` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_id` int(10) UNSIGNED DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_plans_status` (`status`),
  KEY `idx_invoice_plans_period` (`period_year`,`period_month`),
  KEY `idx_invoice_plans_client` (`client_id`),
  KEY `idx_invoice_plans_document` (`document_id`),
  CONSTRAINT `fk_invoice_plans_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bootstrap plans from existing invoices if table is empty.
INSERT INTO invoice_plans (
  client_id,
  period_year,
  period_month,
  period_label,
  status,
  work_items_json,
  channels_json,
  document_id,
  created_at,
  sent_at,
  updated_at
)
SELECT
  d.client_id,
  d.period_year,
  d.period_month,
  CONCAT(LPAD(d.period_month, 2, '0'), '.', d.period_year) AS period_label,
  CASE WHEN d.is_paid = 1 THEN 'paid' ELSE 'sent_waiting_payment' END AS status,
  COALESCE((
    SELECT CONCAT(
      '[',
      GROUP_CONCAT(
        CONCAT(
          '{"name":', JSON_QUOTE(ii.service_name),
          ',"amount":', IFNULL(ii.service_price, 0),
          ',"category":""}'
        )
        ORDER BY ii.sort_order, ii.id SEPARATOR ','
      ),
      ']'
    )
    FROM client_invoice_items ii
    WHERE ii.client_id = d.client_id
  ), '[]') AS work_items_json,
  JSON_OBJECT(
    'email', c.email,
    'send_telegram', c.send_invoice_telegram,
    'send_diadoc', c.send_invoice_diadoc
  ) AS channels_json,
  d.id AS document_id,
  d.created_at,
  d.created_at,
  NOW()
FROM finance_documents d
INNER JOIN clients c ON c.id = d.client_id
WHERE d.doc_type = 'invoice'
  AND NOT EXISTS (SELECT 1 FROM invoice_plans);
