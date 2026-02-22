<?php

require_once APP_BASE_PATH . '/app/auth/Auth.php';
require_once APP_BASE_PATH . '/app/models/WorkCategoryModel.php';
require_once APP_BASE_PATH . '/app/models/PlannedInvoiceModel.php';
require_once APP_BASE_PATH . '/app/models/SettingsModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceDocumentModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceSendEventModel.php';
require_once APP_BASE_PATH . '/app/services/FinanceFileStorage.php';
require_once APP_BASE_PATH . '/app/services/Finance/EmailService.php';
require_once APP_BASE_PATH . '/app/services/Finance/TelegramService.php';
require_once APP_BASE_PATH . '/app/services/Finance/TBankService.php';
require_once APP_BASE_PATH . '/app/services/Finance/DiadocService.php';

class KanbanController
{
    /** @var WorkCategoryModel */
    private $categories;
    /** @var PlannedInvoiceModel */
    private $planned;
    /** @var SettingsModel */
    private $settings;
    /** @var FinanceDocumentModel */
    private $docs;
    /** @var FinanceSendEventModel */
    private $events;
    /** @var mysqli */
    private $db;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
        $this->categories = new WorkCategoryModel($db);
        $this->planned = new PlannedInvoiceModel($db);
        $this->settings = new SettingsModel($db);
        $this->docs = new FinanceDocumentModel($db);
        $this->events = new FinanceSendEventModel($db);
    }

    public function listCategories(): void
    {
        Auth::requireAuth();
        $includeInactive = isset($_GET['include_inactive']) && (int) $_GET['include_inactive'] === 1;
        sendJson(['success' => true, 'data' => ['items' => $this->categories->all($includeInactive)]]);
    }

    public function createCategory(): void
    {
        Auth::requireRole('admin');
        $payload = getJsonPayload();
        $data = $this->validateCategoryPayload($payload, null);

        if ($this->categories->existsTag($data['tag'])) {
            sendError('VALIDATION_ERROR', 'Тег категории должен быть уникальным.');
        }

        $row = $this->categories->create($data);
        if (!$row) {
            sendError('SERVER_ERROR', 'Не удалось создать категорию', 500);
        }

        sendJson(['success' => true, 'data' => $row]);
    }

    public function updateCategory(int $id): void
    {
        Auth::requireRole('admin');
        $existing = $this->categories->findById($id);
        if (!$existing) {
            sendError('NOT_FOUND', 'Категория не найдена', 404);
        }

        $payload = getJsonPayload();
        $data = $this->validateCategoryPayload($payload, $existing);

        if ($this->categories->existsTag($data['tag'], $id)) {
            sendError('VALIDATION_ERROR', 'Тег категории должен быть уникальным.');
        }

        if (!$this->categories->update($id, $data)) {
            sendError('SERVER_ERROR', 'Не удалось обновить категорию', 500);
        }

        $row = $this->categories->findById($id);
        sendJson(['success' => true, 'data' => $row]);
    }

    public function deleteCategory(int $id): void
    {
        Auth::requireRole('admin');
        if (!$this->categories->softDelete($id)) {
            sendError('SERVER_ERROR', 'Не удалось деактивировать категорию', 500);
        }

        sendJson(['success' => true]);
    }

    public function listPlannedInvoices(): void
    {
        Auth::requireAuth();
        $filters = [
            'status' => isset($_GET['status']) ? trim((string) $_GET['status']) : '',
            'client_id' => isset($_GET['client_id']) ? (int) $_GET['client_id'] : 0,
            'period_year' => isset($_GET['period_year']) ? (int) $_GET['period_year'] : 0,
            'period_month' => isset($_GET['period_month']) ? (int) $_GET['period_month'] : 0,
        ];

        sendJson(['success' => true, 'data' => ['items' => $this->planned->list($filters)]]);
    }

    public function createPlannedInvoice(): void
    {
        Auth::requireRole('admin');
        $payload = getJsonPayload();
        $data = $this->validatePlannedInvoicePayload($payload, null);
        $data['created_by_user_id'] = isset($_SESSION['user']['id']) ? (int) $_SESSION['user']['id'] : 0;

        $row = $this->planned->create($data);
        if (!$row) {
            sendError('SERVER_ERROR', 'Не удалось создать карточку счета', 500);
        }

        sendJson(['success' => true, 'data' => $row]);
    }

    public function updatePlannedInvoice(int $id): void
    {
        Auth::requireRole('admin');
        $existing = $this->planned->findById($id);
        if (!$existing) {
            sendError('NOT_FOUND', 'Карточка не найдена', 404);
        }

        $payload = getJsonPayload();
        $data = $this->validatePlannedInvoicePayload($payload, $existing);
        if (!$this->planned->update($id, $data)) {
            sendError('SERVER_ERROR', 'Не удалось обновить карточку', 500);
        }

        sendJson(['success' => true, 'data' => $this->planned->findById($id)]);
    }

    public function archivePlannedInvoice(int $id): void
    {
        Auth::requireRole('admin');
        if (!$this->planned->archive($id)) {
            sendError('SERVER_ERROR', 'Не удалось архивировать карточку', 500);
        }
        sendJson(['success' => true]);
    }

    public function sendPlannedInvoice(int $id): void
    {
        Auth::requireRole('admin');
        $card = $this->planned->findById($id);
        if (!$card) {
            sendError('NOT_FOUND', 'Карточка не найдена', 404);
        }

        if ($card['status'] === 'archived') {
            sendError('VALIDATION_ERROR', 'Архивную карточку отправлять нельзя.', 400);
        }

        $client = $this->getClientById((int) $card['client_id']);
        if (!$client) {
            sendError('NOT_FOUND', 'Клиент карточки не найден', 404);
        }

        $settings = $this->settings->get();
        $invoicePrefix = isset($settings['finance_invoice_number_prefix']) ? (string) $settings['finance_invoice_number_prefix'] : 'INV-';
        $dueDays = isset($settings['finance_tbank_invoice_due_days']) ? (int) $settings['finance_tbank_invoice_due_days'] : 7;
        $unitDefault = isset($settings['finance_tbank_unit_default']) ? (string) $settings['finance_tbank_unit_default'] : 'Шт';
        $vatDefault = isset($settings['finance_tbank_vat_default']) ? (string) $settings['finance_tbank_vat_default'] : 'None';

        $doc = $this->docs->findByPeriod('invoice', (int) $card['client_id'], (int) $card['period_year'], (int) $card['period_month']);

        if (!$doc) {
            $items = $this->normalizeInvoiceItems($card['work_items'], $unitDefault, $vatDefault);
            if (empty($items)) {
                sendError('VALIDATION_ERROR', 'Нет строк работ для формирования счета.');
            }

            $sum = 0.0;
            foreach ($items as $it) {
                $sum += (float) $it['price'];
            }

            $invoiceNumber = $invoicePrefix . sprintf('%04d%02d-%d', (int) $card['period_year'], (int) $card['period_month'], (int) $card['client_id']);
            $invoiceDate = date('Y-m-d');
            $dueDate = date('Y-m-d', time() + max(0, $dueDays) * 86400);

            $payload = [
                'invoiceNumber' => $invoiceNumber,
                'invoiceDate' => $invoiceDate,
                'dueDate' => $dueDate,
                'payer' => [
                    'name' => (string) ($client['legal_name'] ?: $client['name']),
                    'inn' => (string) ($client['inn'] ?: ''),
                ],
                'items' => $items,
            ];

            if (!empty($client['kpp'])) {
                $payload['payer']['kpp'] = (string) $client['kpp'];
            }
            if (!empty($client['email'])) {
                $payload['contacts'] = [['email' => (string) $client['email']]];
            }

            $tbank = new TBankService((string) ($settings['tinkoff_business_token'] ?? ''));
            $create = $tbank->createInvoice($payload);
            if (!$create[0]) {
                sendError('TBANK_ERROR', 'Не удалось создать счет в T-Bank: ' . $create[1], 502);
            }

            $tb = $create[2];
            $invoiceId = isset($tb['invoiceId']) ? (string) $tb['invoiceId'] : '';
            $pdfUrl = isset($tb['pdfUrl']) ? (string) $tb['pdfUrl'] : '';
            if ($pdfUrl === '') {
                sendError('TBANK_ERROR', 'T-Bank не вернул pdfUrl', 502);
            }

            $pdfBytes = file_get_contents($pdfUrl);
            if ($pdfBytes === false) {
                sendError('SERVER_ERROR', 'Не удалось скачать PDF счета', 500);
            }

            $fileName = 'Счет_' . FinanceFileStorage::sanitizeFileName((string) ($client['legal_name'] ?: $client['name'])) . '_' . date('dmY') . '.pdf';
            $saved = FinanceFileStorage::savePdfBytes('invoice', (int) $card['period_year'], (int) $card['period_month'], $fileName, $pdfBytes);
            $downloadToken = bin2hex(random_bytes(24));

            $docId = $this->docs->insert([
                'doc_type' => 'invoice',
                'client_id' => (int) $card['client_id'],
                'period_year' => (int) $card['period_year'],
                'period_month' => (int) $card['period_month'],
                'doc_number' => $invoiceNumber,
                'doc_date' => $invoiceDate,
                'due_date' => $dueDate,
                'total_sum' => (float) $sum,
                'currency' => 'RUB',
                'file_rel_path' => $saved['rel_path'],
                'file_name' => $saved['file_name'],
                'file_size' => (int) $saved['size'],
                'file_sha256' => (string) $saved['sha256'],
                'download_token' => $downloadToken,
                'tbank_invoice_id' => $invoiceId,
                'tbank_pdf_url' => $pdfUrl,
            ]);

            $doc = $this->docs->findByPeriod('invoice', (int) $card['client_id'], (int) $card['period_year'], (int) $card['period_month']);
            if (!$doc) {
                sendError('SERVER_ERROR', 'Не удалось сохранить документ счета', 500);
            }
        }

        $this->sendInvoiceByChannels($doc, $client, $settings, true, true, true);

        $sentAt = date('Y-m-d H:i:s');
        $paymentStatus = !empty($doc['is_paid']) ? 'paid' : 'unpaid';
        $days = 0;
        $isOverdue = 0;
        if (!empty($doc['due_date']) && $paymentStatus !== 'paid') {
            $days = max(0, (int) floor((time() - strtotime((string) $doc['due_date'])) / 86400));
            $isOverdue = $days > 0 ? 1 : 0;
        }

        $this->planned->update($id, [
            'status' => $paymentStatus === 'paid' ? 'paid' : 'sent_waiting_payment',
            'linked_document_id' => (int) $doc['id'],
            'sent_at' => $sentAt,
            'due_date' => (string) ($doc['due_date'] ?? null),
            'payment_status_cached' => $paymentStatus,
            'payment_date_cached' => !empty($doc['paid_at']) ? (string) $doc['paid_at'] : null,
            'days_overdue_cached' => $days,
            'is_overdue_cached' => $isOverdue,
            'total_sum' => isset($doc['total_sum']) ? (float) $doc['total_sum'] : (float) ($card['total_sum'] ?? 0),
        ]);

        sendJson(['success' => true, 'data' => $this->planned->findById($id)]);
    }

    public function remindPlannedInvoice(int $id): void
    {
        Auth::requireRole('admin');
        $card = $this->planned->findById($id);
        if (!$card) {
            sendError('NOT_FOUND', 'Карточка не найдена', 404);
        }

        if (empty($card['linked_document_id'])) {
            sendError('VALIDATION_ERROR', 'Для напоминания карточка должна быть привязана к счету.', 400);
        }

        $doc = $this->findDocumentById((int) $card['linked_document_id']);
        if (!$doc) {
            sendError('NOT_FOUND', 'Документ счета не найден', 404);
        }

        $client = $this->getClientById((int) $card['client_id']);
        if (!$client) {
            sendError('NOT_FOUND', 'Клиент карточки не найден', 404);
        }

        $settings = $this->settings->get();
        $this->sendInvoiceByChannels($doc, $client, $settings, true, true, false, true);

        if (!$this->planned->update($id, ['last_reminded_at' => date('Y-m-d H:i:s')])) {
            sendError('SERVER_ERROR', 'Не удалось отметить напоминание', 500);
        }

        sendJson(['success' => true, 'data' => $this->planned->findById($id)]);
    }

    private function sendInvoiceByChannels(array $doc, array $client, array $settings, bool $email, bool $telegram, bool $diadoc, bool $isReminder = false): void
    {
        $publicUrl = isset($settings['crm_public_url']) ? rtrim((string) $settings['crm_public_url'], '/') : '';
        $downloadUrl = '';
        if ($publicUrl !== '' && !empty($doc['download_token'])) {
            $downloadUrl = $publicUrl . '/api.php/finance/download?token=' . urlencode((string) $doc['download_token']);
        }

        $absPath = $this->docs->getAbsoluteFilePath($doc);
        if (!$absPath || !is_file($absPath)) {
            throw new RuntimeException('Файл документа не найден');
        }

        if ($email) {
            $emailSvc = new EmailService(
                (string) ($settings['finance_email_from_email'] ?? ''),
                (string) ($settings['finance_email_from_name'] ?? ''),
                (string) ($settings['finance_email_bcc'] ?? '')
            );

            $subject = (string) ($settings['finance_email_subject_invoice'] ?? 'Счет на оплату');
            $body = $isReminder
                ? (string) ($settings['finance_email_body_invoice_reminder_html'] ?? '')
                : (string) ($settings['finance_email_body_invoice_html'] ?? '');
            if ($body === '') {
                $body = '<p>Здравствуйте!</p><p>{DOWNLOAD_URL}</p>';
            }

            $emails = [];
            if (!empty($client['email'])) $emails[] = trim((string) $client['email']);
            if (!empty($client['additional_email'])) $emails[] = trim((string) $client['additional_email']);
            $emails = array_values(array_unique(array_filter($emails)));

            foreach ($emails as $to) {
                $ev = $this->events->getOrCreate((int) $doc['id'], 'email', $to);
                $vars = [
                    '{CLIENT_NAME}' => (string) ($client['name'] ?: $client['legal_name']),
                    '{DOC_NUMBER}' => (string) $doc['doc_number'],
                    '{DOC_DATE}' => (string) $doc['doc_date'],
                    '{PERIOD}' => sprintf('%02d.%04d', (int) $doc['period_month'], (int) $doc['period_year']),
                    '{TOTAL_SUM}' => (string) $doc['total_sum'],
                    '{DOWNLOAD_URL}' => (string) $downloadUrl,
                ];

                $send = $emailSvc->send($to, strtr($subject, $vars), strtr($body, $vars), [
                    ['path' => $absPath, 'name' => basename($absPath), 'type' => 'application/pdf'],
                ]);

                if ($send[0]) {
                    $this->events->markSuccess((int) $ev['id'], '');
                } else {
                    $this->events->markFail((int) $ev['id'], $send[1], '');
                }
            }
        }

        if ($telegram) {
            $sendTg = !empty($client['send_invoice_telegram']);
            $tgChat = '';
            if (!empty($client['chat_id'])) $tgChat = trim((string) $client['chat_id']);
            if ($tgChat === '' && !empty($client['telegram_id'])) $tgChat = trim((string) $client['telegram_id']);

            if ($sendTg && $tgChat !== '') {
                $tgSvc = new TelegramService((string) ($settings['finance_telegram_bot_token'] ?? ''));
                $msgTemplate = $isReminder
                    ? (string) ($settings['telegram_default_message_invoice_reminder'] ?? '')
                    : (string) ($settings['telegram_default_message_invoice'] ?? '');
                if ($msgTemplate === '') {
                    $msgTemplate = 'Счет: {DOWNLOAD_URL}';
                }

                $ev = $this->events->getOrCreate((int) $doc['id'], 'telegram', $tgChat);
                $caption = strtr($msgTemplate, [
                    '{CLIENT_NAME}' => (string) ($client['name'] ?: $client['legal_name']),
                    '{DOC_NUMBER}' => (string) $doc['doc_number'],
                    '{DOC_DATE}' => (string) $doc['doc_date'],
                    '{PERIOD}' => sprintf('%02d.%04d', (int) $doc['period_month'], (int) $doc['period_year']),
                    '{TOTAL_SUM}' => (string) $doc['total_sum'],
                    '{DOWNLOAD_URL}' => (string) $downloadUrl,
                ]);

                $send = $tgSvc->sendDocument($tgChat, $absPath, $caption);
                if ($send[0]) {
                    $this->events->markSuccess((int) $ev['id'], is_string($send[2] ?? null) ? $send[2] : '');
                } else {
                    $this->events->markFail((int) $ev['id'], $send[1], is_string($send[2] ?? null) ? $send[2] : '');
                }
            }
        }

        if ($diadoc && !empty($client['send_invoice_diadoc']) && !empty($client['inn'])) {
            $diadocSvc = new DiadocService(
                (string) ($settings['finance_diadoc_api_client_id'] ?? ''),
                (string) ($settings['finance_diadoc_login'] ?? ''),
                (string) ($settings['finance_diadoc_password'] ?? ''),
                (string) ($settings['finance_diadoc_from_box_id'] ?? '')
            );

            $recipientInn = (string) $client['inn'];
            $ev = $this->events->getOrCreate((int) $doc['id'], 'diadoc', $recipientInn);
            $send = $diadocSvc->sendInvoicePdf(
                $recipientInn,
                (string) (isset($doc['file_name']) ? $doc['file_name'] : basename($absPath)),
                $absPath,
                (string) $doc['doc_date'],
                (int) round((float) $doc['total_sum']),
                (string) $doc['doc_number']
            );
            if ($send[0]) {
                $this->events->markSuccess((int) $ev['id'], is_string($send[2] ?? null) ? $send[2] : '');
            } else {
                $this->events->markFail((int) $ev['id'], $send[1], is_string($send[2] ?? null) ? $send[2] : '');
            }
        }
    }

    private function findDocumentById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM finance_documents WHERE id = ? LIMIT 1');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        return $row ?: null;
    }

    private function getClientById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM clients WHERE id = ? LIMIT 1');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        return $row ?: null;
    }

    private function normalizeInvoiceItems(array $workItems, string $unitDefault, string $vatDefault): array
    {
        $out = [];
        foreach ($workItems as $it) {
            $name = trim((string) ($it['name'] ?? ''));
            $price = (float) ($it['amount'] ?? 0);
            if ($name === '' || $price <= 0) {
                continue;
            }
            $out[] = [
                'name' => $name,
                'price' => $price,
                'quantity' => 1,
                'unit' => (string) ($it['unit'] ?? $unitDefault),
                'vat' => (string) ($it['vat'] ?? $vatDefault),
            ];
        }
        return $out;
    }

    private function validateCategoryPayload(array $payload, ?array $existing): array
    {
        $name = isset($payload['name']) ? trim((string) $payload['name']) : ($existing['name'] ?? '');
        $tag = isset($payload['tag']) ? mb_strtolower(trim((string) $payload['tag'])) : ($existing['tag'] ?? '');
        $sortOrder = array_key_exists('sort_order', $payload) ? (int) $payload['sort_order'] : (int) ($existing['sort_order'] ?? 0);
        $isActive = array_key_exists('is_active', $payload) ? (int) ((int) $payload['is_active'] === 1) : (int) ($existing['is_active'] ?? 1);

        if ($name === '' || $tag === '') {
            sendError('VALIDATION_ERROR', 'Название и тег категории обязательны.');
        }

        if (!preg_match('/^[a-z0-9_-]+$/', $tag)) {
            sendError('VALIDATION_ERROR', 'Тег категории: только латиница, цифры, "_" и "-".');
        }

        return [
            'name' => $name,
            'tag' => $tag,
            'sort_order' => $sortOrder,
            'is_active' => $isActive,
        ];
    }

    private function validatePlannedInvoicePayload(array $payload, ?array $existing): array
    {
        $status = isset($payload['status']) ? (string) $payload['status'] : (string) ($existing['status'] ?? 'planned');
        $allowedStatuses = ['planned', 'sent_waiting_payment', 'paid', 'archived'];
        if (!in_array($status, $allowedStatuses, true)) {
            sendError('VALIDATION_ERROR', 'Некорректный статус карточки.');
        }

        $clientId = array_key_exists('client_id', $payload) ? (int) $payload['client_id'] : (int) ($existing['client_id'] ?? 0);
        $periodYear = array_key_exists('period_year', $payload) ? (int) $payload['period_year'] : (int) ($existing['period_year'] ?? date('Y'));
        $periodMonth = array_key_exists('period_month', $payload) ? (int) $payload['period_month'] : (int) ($existing['period_month'] ?? date('n'));

        if ($clientId <= 0) {
            sendError('VALIDATION_ERROR', 'client_id обязателен.');
        }
        if ($periodMonth < 1 || $periodMonth > 12) {
            sendError('VALIDATION_ERROR', 'period_month должен быть в диапазоне 1-12.');
        }

        $workItems = array_key_exists('work_items', $payload) ? $payload['work_items'] : ($existing['work_items'] ?? []);
        if (!is_array($workItems)) {
            sendError('VALIDATION_ERROR', 'work_items должен быть массивом.');
        }
        $categories = array_key_exists('categories', $payload) ? $payload['categories'] : ($existing['categories'] ?? []);
        if (!is_array($categories)) {
            sendError('VALIDATION_ERROR', 'categories должен быть массивом.');
        }

        $totalSum = array_key_exists('total_sum', $payload) ? (float) $payload['total_sum'] : (float) ($existing['total_sum'] ?? 0);
        $plannedSendDate = array_key_exists('planned_send_date', $payload) ? (string) $payload['planned_send_date'] : ($existing['planned_send_date'] ?? null);
        $sentAt = array_key_exists('sent_at', $payload) ? (string) $payload['sent_at'] : ($existing['sent_at'] ?? null);
        $dueDate = array_key_exists('due_date', $payload) ? (string) $payload['due_date'] : ($existing['due_date'] ?? null);
        $paymentStatus = array_key_exists('payment_status_cached', $payload) ? (string) $payload['payment_status_cached'] : ($existing['payment_status_cached'] ?? 'unpaid');
        $paymentDate = array_key_exists('payment_date_cached', $payload) ? (string) $payload['payment_date_cached'] : ($existing['payment_date_cached'] ?? null);
        $daysOverdue = array_key_exists('days_overdue_cached', $payload) ? (int) $payload['days_overdue_cached'] : (int) ($existing['days_overdue_cached'] ?? 0);
        $isOverdue = array_key_exists('is_overdue_cached', $payload) ? (int) ((int) $payload['is_overdue_cached'] === 1) : (int) ($existing['is_overdue_cached'] ?? 0);
        $linkedDocumentId = array_key_exists('linked_document_id', $payload) ? (int) $payload['linked_document_id'] : (int) ($existing['linked_document_id'] ?? 0);
        $notes = array_key_exists('notes', $payload) ? (string) $payload['notes'] : (string) ($existing['notes'] ?? '');

        return [
            'client_id' => $clientId,
            'period_year' => $periodYear,
            'period_month' => $periodMonth,
            'planned_send_date' => $plannedSendDate ?: null,
            'status' => $status,
            'work_items_json' => json_encode(array_values($workItems), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'categories_json' => json_encode(array_values($categories), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'total_sum' => $totalSum,
            'sent_at' => $sentAt ?: null,
            'due_date' => $dueDate ?: null,
            'payment_status_cached' => $paymentStatus,
            'payment_date_cached' => $paymentDate ?: null,
            'days_overdue_cached' => $daysOverdue,
            'is_overdue_cached' => $isOverdue,
            'linked_document_id' => $linkedDocumentId,
            'created_by_user_id' => (int) ($existing['created_by_user_id'] ?? 0),
            'notes' => $notes,
        ];
    }
}
