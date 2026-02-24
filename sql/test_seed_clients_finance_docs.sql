START TRANSACTION;

-- 1) Delete current client-related data
DELETE FROM finance_send_events
WHERE document_id IN (SELECT id FROM finance_documents WHERE client_id IS NOT NULL);

DELETE FROM finance_download_events
WHERE document_id IN (SELECT id FROM finance_documents WHERE client_id IS NOT NULL);

DELETE FROM finance_documents
WHERE client_id IS NOT NULL;

DELETE FROM client_invoice_items;
DELETE FROM client_act_items;
DELETE FROM clients;

ALTER TABLE clients AUTO_INCREMENT = 1;
ALTER TABLE client_invoice_items AUTO_INCREMENT = 1;
ALTER TABLE client_act_items AUTO_INCREMENT = 1;
ALTER TABLE finance_documents AUTO_INCREMENT = 1;
ALTER TABLE finance_send_events AUTO_INCREMENT = 1;
ALTER TABLE finance_download_events AUTO_INCREMENT = 1;

-- 2) Insert 20 synthetic clients (test-only data)
INSERT INTO clients (
  name, legal_name, inn, kpp, contact_person, email, additional_email, phone,
  industry, website, manager_employee_id, tracker_project_id, client_type,
  send_invoice_schedule, invoice_use_end_month_date, send_invoice_telegram,
  send_invoice_diadoc, send_act_diadoc, telegram_id, chat_id,
  diadoc_box_id, diadoc_department_id, notes
) VALUES
('Demo Test Client 01', 'ООО "Демо Клиент 01"', '771000000001', '770100001', 'Иван Тестов 01', 'demo01@example.test', NULL, '+7-900-100-0001', 'IT', 'https://demo01.test', NULL, 0, 'support', 1, 0, 1, 1, 1, 'tg_demo_01', '10000001', 'box_demo_01', 'dep_demo_01', 'Synthetic QA client'),
('Demo Test Client 02', 'ООО "Демо Клиент 02"', '771000000002', '770100002', 'Иван Тестов 02', 'demo02@example.test', NULL, '+7-900-100-0002', 'Retail', 'https://demo02.test', NULL, 0, 'project', 1, 1, 0, 1, 1, NULL, NULL, 'box_demo_02', 'dep_demo_02', 'Synthetic QA client'),
('Demo Test Client 03', 'ООО "Демо Клиент 03"', '771000000003', '770100003', 'Иван Тестов 03', 'demo03@example.test', 'billing03@example.test', '+7-900-100-0003', 'Healthcare', 'https://demo03.test', NULL, 0, 'support', 1, 0, 1, 0, 0, 'tg_demo_03', '10000003', NULL, NULL, 'Synthetic QA client'),
('Demo Test Client 04', 'ООО "Демо Клиент 04"', '771000000004', '770100004', 'Иван Тестов 04', 'demo04@example.test', NULL, '+7-900-100-0004', 'Finance', 'https://demo04.test', NULL, 0, 'support', 1, 1, 1, 1, 1, 'tg_demo_04', '10000004', 'box_demo_04', 'dep_demo_04', 'Synthetic QA client'),
('Demo Test Client 05', 'ООО "Демо Клиент 05"', '771000000005', '770100005', 'Иван Тестов 05', 'demo05@example.test', NULL, '+7-900-100-0005', 'Logistics', 'https://demo05.test', NULL, 0, 'project', 1, 0, 0, 0, 0, NULL, NULL, NULL, NULL, 'Synthetic QA client'),
('Demo Test Client 06', 'ООО "Демо Клиент 06"', '771000000006', '770100006', 'Иван Тестов 06', 'demo06@example.test', NULL, '+7-900-100-0006', 'IT', 'https://demo06.test', NULL, 0, 'support', 1, 1, 1, 1, 0, 'tg_demo_06', '10000006', 'box_demo_06', 'dep_demo_06', 'Synthetic QA client'),
('Demo Test Client 07', 'ООО "Демо Клиент 07"', '771000000007', '770100007', 'Иван Тестов 07', 'demo07@example.test', 'finance07@example.test', '+7-900-100-0007', 'Construction', 'https://demo07.test', NULL, 0, 'support', 1, 0, 1, 0, 0, 'tg_demo_07', '10000007', NULL, NULL, 'Synthetic QA client'),
('Demo Test Client 08', 'ООО "Демо Клиент 08"', '771000000008', '770100008', 'Иван Тестов 08', 'demo08@example.test', NULL, '+7-900-100-0008', 'Edu', 'https://demo08.test', NULL, 0, 'project', 1, 1, 0, 1, 1, NULL, NULL, 'box_demo_08', 'dep_demo_08', 'Synthetic QA client'),
('Demo Test Client 09', 'ООО "Демо Клиент 09"', '771000000009', '770100009', 'Иван Тестов 09', 'demo09@example.test', NULL, '+7-900-100-0009', 'Travel', 'https://demo09.test', NULL, 0, 'support', 1, 0, 1, 1, 0, 'tg_demo_09', '10000009', 'box_demo_09', 'dep_demo_09', 'Synthetic QA client'),
('Demo Test Client 10', 'ООО "Демо Клиент 10"', '771000000010', '770100010', 'Иван Тестов 10', 'demo10@example.test', NULL, '+7-900-100-0010', 'Media', 'https://demo10.test', NULL, 0, 'support', 1, 1, 1, 0, 0, 'tg_demo_10', '10000010', NULL, NULL, 'Synthetic QA client'),
('Demo Test Client 11', 'ООО "Демо Клиент 11"', '771000000011', '770100011', 'Иван Тестов 11', 'demo11@example.test', NULL, '+7-900-100-0011', 'IT', 'https://demo11.test', NULL, 0, 'project', 1, 0, 0, 1, 1, NULL, NULL, 'box_demo_11', 'dep_demo_11', 'Synthetic QA client'),
('Demo Test Client 12', 'ООО "Демо Клиент 12"', '771000000012', '770100012', 'Иван Тестов 12', 'demo12@example.test', NULL, '+7-900-100-0012', 'Retail', 'https://demo12.test', NULL, 0, 'support', 1, 1, 1, 0, 0, 'tg_demo_12', '10000012', NULL, NULL, 'Synthetic QA client'),
('Demo Test Client 13', 'ООО "Демо Клиент 13"', '771000000013', '770100013', 'Иван Тестов 13', 'demo13@example.test', NULL, '+7-900-100-0013', 'Healthcare', 'https://demo13.test', NULL, 0, 'support', 1, 0, 1, 1, 1, 'tg_demo_13', '10000013', 'box_demo_13', 'dep_demo_13', 'Synthetic QA client'),
('Demo Test Client 14', 'ООО "Демо Клиент 14"', '771000000014', '770100014', 'Иван Тестов 14', 'demo14@example.test', NULL, '+7-900-100-0014', 'Finance', 'https://demo14.test', NULL, 0, 'project', 1, 1, 0, 0, 0, NULL, NULL, NULL, NULL, 'Synthetic QA client'),
('Demo Test Client 15', 'ООО "Демо Клиент 15"', '771000000015', '770100015', 'Иван Тестов 15', 'demo15@example.test', NULL, '+7-900-100-0015', 'Logistics', 'https://demo15.test', NULL, 0, 'support', 1, 0, 1, 1, 1, 'tg_demo_15', '10000015', 'box_demo_15', 'dep_demo_15', 'Synthetic QA client'),
('Demo Test Client 16', 'ООО "Демо Клиент 16"', '771000000016', '770100016', 'Иван Тестов 16', 'demo16@example.test', NULL, '+7-900-100-0016', 'IT', 'https://demo16.test', NULL, 0, 'support', 1, 1, 1, 0, 0, 'tg_demo_16', '10000016', NULL, NULL, 'Synthetic QA client'),
('Demo Test Client 17', 'ООО "Демо Клиент 17"', '771000000017', '770100017', 'Иван Тестов 17', 'demo17@example.test', NULL, '+7-900-100-0017', 'Construction', 'https://demo17.test', NULL, 0, 'project', 1, 0, 0, 1, 1, NULL, NULL, 'box_demo_17', 'dep_demo_17', 'Synthetic QA client'),
('Demo Test Client 18', 'ООО "Демо Клиент 18"', '771000000018', '770100018', 'Иван Тестов 18', 'demo18@example.test', NULL, '+7-900-100-0018', 'Edu', 'https://demo18.test', NULL, 0, 'support', 1, 1, 1, 1, 0, 'tg_demo_18', '10000018', 'box_demo_18', 'dep_demo_18', 'Synthetic QA client'),
('Demo Test Client 19', 'ООО "Демо Клиент 19"', '771000000019', '770100019', 'Иван Тестов 19', 'demo19@example.test', NULL, '+7-900-100-0019', 'Travel', 'https://demo19.test', NULL, 0, 'support', 1, 0, 1, 0, 0, 'tg_demo_19', '10000019', NULL, NULL, 'Synthetic QA client'),
('Demo Test Client 20', 'ООО "Демо Клиент 20"', '771000000020', '770100020', 'Иван Тестов 20', 'demo20@example.test', NULL, '+7-900-100-0020', 'Media', 'https://demo20.test', NULL, 0, 'project', 1, 1, 0, 1, 1, NULL, NULL, 'box_demo_20', 'dep_demo_20', 'Synthetic QA client');

-- 3) Add default invoice/act line items per client
INSERT INTO client_invoice_items (client_id, service_name, service_price, sort_order)
SELECT c.id, CONCAT('Support package ', LPAD(c.id, 2, '0')), 25000 + (c.id * 700), 1
FROM clients c;

INSERT INTO client_invoice_items (client_id, service_name, service_price, sort_order)
SELECT c.id, CONCAT('Additional works ', LPAD(c.id, 2, '0')), 5000 + (c.id * 300), 2
FROM clients c;

INSERT INTO client_act_items (client_id, service_name, service_amount, sort_order)
SELECT c.id, CONCAT('Works completed ', LPAD(c.id, 2, '0')), 22000 + (c.id * 600), 1
FROM clients c;

INSERT INTO client_act_items (client_id, service_name, service_amount, sort_order)
SELECT c.id, CONCAT('Emergency support ', LPAD(c.id, 2, '0')), 4000 + (c.id * 200), 2
FROM clients c;

-- 4) Create invoices for 4 previous months with mixed statuses
INSERT INTO finance_documents (
  doc_type, client_id, period_year, period_month, doc_date, due_date, doc_number,
  total_sum, currency, file_rel_path, file_size, file_sha256, download_token,
  tbank_invoice_id, tbank_pdf_url, tbank_status, tbank_created_at,
  diadoc_message_id, diadoc_entity_id,
  is_paid, paid_sum, paid_at, last_payment_check_at, created_at, updated_at
)
SELECT
  'invoice' AS doc_type,
  c.id,
  YEAR(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH)) AS period_year,
  MONTH(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH)) AS period_month,
  DATE_ADD(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y-%m-01'), INTERVAL 2 DAY) AS doc_date,
  CASE
    WHEN MOD(c.id + m.mo, 3) = 2 THEN DATE_ADD(CURDATE(), INTERVAL 3 DAY)
    ELSE DATE_ADD(DATE_ADD(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y-%m-01'), INTERVAL 2 DAY), INTERVAL 7 DAY)
  END AS due_date,
  CONCAT('INV-', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y%m'), '-', LPAD(c.id, 3, '0')) AS doc_number,
  (30000 + c.id * 900 + m.mo * 400) AS total_sum,
  'RUB' AS currency,
  CONCAT('storage/finance/invoices/', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y/%m'), '/inv_', LPAD(c.id, 3, '0'), '.pdf') AS file_rel_path,
  120000 + c.id * 10 + m.mo AS file_size,
  SHA2(CONCAT('invoice-', c.id, '-', m.mo), 256) AS file_sha256,
  SHA2(CONCAT('dl-invoice-', c.id, '-', m.mo), 256) AS download_token,
  CONCAT('tb_', c.id, '_', m.mo) AS tbank_invoice_id,
  CONCAT('https://tbank.example.test/invoice/', c.id, '/', m.mo) AS tbank_pdf_url,
  CASE
    WHEN MOD(c.id + m.mo, 3) = 0 THEN 'PAID'
    WHEN MOD(c.id + m.mo, 3) = 1 THEN 'SENT'
    ELSE 'ISSUED'
  END AS tbank_status,
  DATE_ADD(DATE_ADD(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y-%m-01'), INTERVAL 2 DAY), INTERVAL 1 HOUR) AS tbank_created_at,
  CASE WHEN c.send_invoice_diadoc = 1 THEN CONCAT('dd_msg_', c.id, '_', m.mo) ELSE NULL END AS diadoc_message_id,
  CASE WHEN c.send_invoice_diadoc = 1 THEN CONCAT('dd_ent_', c.id, '_', m.mo) ELSE NULL END AS diadoc_entity_id,
  CASE WHEN MOD(c.id + m.mo, 3) = 0 THEN 1 ELSE 0 END AS is_paid,
  CASE WHEN MOD(c.id + m.mo, 3) = 0 THEN (30000 + c.id * 900 + m.mo * 400) ELSE 0 END AS paid_sum,
  CASE WHEN MOD(c.id + m.mo, 3) = 0 THEN DATE_ADD(DATE_ADD(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y-%m-01'), INTERVAL 2 DAY), INTERVAL 5 DAY) ELSE NULL END AS paid_at,
  NOW() AS last_payment_check_at,
  DATE_ADD(DATE_ADD(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y-%m-01'), INTERVAL 2 DAY), INTERVAL 1 HOUR) AS created_at,
  NOW() AS updated_at
FROM clients c
JOIN (
  SELECT 1 AS mo
  UNION ALL SELECT 2
  UNION ALL SELECT 3
  UNION ALL SELECT 4
) m;

-- 5) Create acts for the same 4 previous months
INSERT INTO finance_documents (
  doc_type, client_id, period_year, period_month, doc_date, due_date, doc_number,
  total_sum, currency, file_rel_path, file_size, file_sha256, download_token,
  tbank_invoice_id, tbank_pdf_url, tbank_status, tbank_created_at,
  diadoc_message_id, diadoc_entity_id,
  is_paid, paid_sum, paid_at, last_payment_check_at, created_at, updated_at
)
SELECT
  'act' AS doc_type,
  c.id,
  YEAR(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH)) AS period_year,
  MONTH(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH)) AS period_month,
  DATE_ADD(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y-%m-01'), INTERVAL 25 DAY) AS doc_date,
  NULL AS due_date,
  CONCAT('ACT-', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y%m'), '-', LPAD(c.id, 3, '0')) AS doc_number,
  (28000 + c.id * 850 + m.mo * 300) AS total_sum,
  'RUB' AS currency,
  CONCAT('storage/finance/acts/', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y/%m'), '/act_', LPAD(c.id, 3, '0'), '.pdf') AS file_rel_path,
  115000 + c.id * 9 + m.mo AS file_size,
  SHA2(CONCAT('act-', c.id, '-', m.mo), 256) AS file_sha256,
  SHA2(CONCAT('dl-act-', c.id, '-', m.mo), 256) AS download_token,
  NULL AS tbank_invoice_id,
  NULL AS tbank_pdf_url,
  NULL AS tbank_status,
  NULL AS tbank_created_at,
  CASE WHEN c.send_act_diadoc = 1 THEN CONCAT('dd_act_msg_', c.id, '_', m.mo) ELSE NULL END AS diadoc_message_id,
  CASE WHEN c.send_act_diadoc = 1 THEN CONCAT('dd_act_ent_', c.id, '_', m.mo) ELSE NULL END AS diadoc_entity_id,
  CASE WHEN MOD(c.id + m.mo, 4) IN (0,1) THEN 1 ELSE 0 END AS is_paid,
  CASE WHEN MOD(c.id + m.mo, 4) IN (0,1) THEN (28000 + c.id * 850 + m.mo * 300) ELSE 0 END AS paid_sum,
  CASE WHEN MOD(c.id + m.mo, 4) IN (0,1) THEN DATE_ADD(DATE_ADD(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y-%m-01'), INTERVAL 25 DAY), INTERVAL 3 DAY) ELSE NULL END AS paid_at,
  NOW() AS last_payment_check_at,
  DATE_ADD(DATE_ADD(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL m.mo MONTH), '%Y-%m-01'), INTERVAL 25 DAY), INTERVAL 1 HOUR) AS created_at,
  NOW() AS updated_at
FROM clients c
JOIN (
  SELECT 1 AS mo
  UNION ALL SELECT 2
  UNION ALL SELECT 3
  UNION ALL SELECT 4
) m;

-- 6) Generate send events for invoices and acts
INSERT INTO finance_send_events (
  document_id, channel, recipient, recipient_hash, status, attempts,
  last_attempt_at, success_at, last_error, response_json, open_token,
  opened_at, created_at, updated_at
)
SELECT
  d.id,
  'email',
  COALESCE(c.email, ''),
  SHA1(LOWER(COALESCE(c.email, ''))),
  CASE WHEN c.email IS NULL OR c.email = '' THEN 'skipped' ELSE 'success' END,
  1,
  d.created_at,
  CASE WHEN c.email IS NULL OR c.email = '' THEN NULL ELSE d.created_at END,
  CASE WHEN c.email IS NULL OR c.email = '' THEN 'Email is empty' ELSE NULL END,
  '{"mock":true,"channel":"email"}',
  CASE WHEN d.doc_type = 'invoice' THEN SHA2(CONCAT('open-email-', d.id), 256) ELSE NULL END,
  CASE WHEN d.doc_type = 'invoice' AND MOD(d.id, 5) = 0 THEN DATE_ADD(d.created_at, INTERVAL 1 DAY) ELSE NULL END,
  d.created_at,
  NOW()
FROM finance_documents d
JOIN clients c ON c.id = d.client_id;

INSERT INTO finance_send_events (
  document_id, channel, recipient, recipient_hash, status, attempts,
  last_attempt_at, success_at, last_error, response_json, open_token,
  opened_at, created_at, updated_at
)
SELECT
  d.id,
  'telegram',
  COALESCE(c.chat_id, ''),
  SHA1(COALESCE(c.chat_id, '')),
  CASE
    WHEN c.send_invoice_telegram = 1 AND c.chat_id IS NOT NULL AND c.chat_id <> '' THEN 'success'
    ELSE 'skipped'
  END,
  1,
  d.created_at,
  CASE
    WHEN c.send_invoice_telegram = 1 AND c.chat_id IS NOT NULL AND c.chat_id <> '' THEN d.created_at
    ELSE NULL
  END,
  CASE
    WHEN c.send_invoice_telegram = 1 AND c.chat_id IS NOT NULL AND c.chat_id <> '' THEN NULL
    ELSE 'Telegram disabled or chat_id empty'
  END,
  '{"mock":true,"channel":"telegram"}',
  NULL,
  NULL,
  d.created_at,
  NOW()
FROM finance_documents d
JOIN clients c ON c.id = d.client_id
WHERE d.doc_type = 'invoice';

INSERT INTO finance_send_events (
  document_id, channel, recipient, recipient_hash, status, attempts,
  last_attempt_at, success_at, last_error, response_json, open_token,
  opened_at, created_at, updated_at
)
SELECT
  d.id,
  'diadoc',
  COALESCE(c.diadoc_box_id, ''),
  SHA1(COALESCE(c.diadoc_box_id, '')),
  CASE
    WHEN d.doc_type = 'invoice' AND c.send_invoice_diadoc = 1 THEN 'success'
    WHEN d.doc_type = 'act' AND c.send_act_diadoc = 1 THEN 'success'
    ELSE 'skipped'
  END,
  1,
  d.created_at,
  CASE
    WHEN (d.doc_type = 'invoice' AND c.send_invoice_diadoc = 1) OR (d.doc_type = 'act' AND c.send_act_diadoc = 1) THEN d.created_at
    ELSE NULL
  END,
  CASE
    WHEN (d.doc_type = 'invoice' AND c.send_invoice_diadoc = 1) OR (d.doc_type = 'act' AND c.send_act_diadoc = 1) THEN NULL
    ELSE 'Diadoc disabled'
  END,
  '{"mock":true,"channel":"diadoc"}',
  NULL,
  NULL,
  d.created_at,
  NOW()
FROM finance_documents d
JOIN clients c ON c.id = d.client_id;

COMMIT;

-- Verification snapshot
SELECT COUNT(*) AS clients_count FROM clients;
SELECT doc_type, COUNT(*) AS docs_count FROM finance_documents GROUP BY doc_type ORDER BY doc_type;
SELECT
  SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) AS paid_docs,
  SUM(CASE WHEN is_paid = 0 THEN 1 ELSE 0 END) AS unpaid_docs
FROM finance_documents;
