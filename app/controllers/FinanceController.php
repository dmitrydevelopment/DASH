<?php

require_once APP_BASE_PATH . '/app/models/FinanceDocumentModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceSendEventModel.php';
require_once APP_BASE_PATH . '/app/models/InvoicePlanModel.php';

class FinanceController
{
    private $docs;
    private $events;
    private $plans;

    public function __construct(mysqli $db)
    {
        $this->docs = new FinanceDocumentModel($db);
        $this->events = new FinanceSendEventModel($db);
        $this->plans = new InvoicePlanModel($db);
    }

    /**
     * GET /finance/download?token=...
     */
    public function download()
    {
        $token = isset($_GET['token']) ? trim((string) $_GET['token']) : '';
        if ($token === '' || strlen($token) < 16) {
            sendError('INVALID_TOKEN', 'Некорректный токен', 400);
        }

        $doc = $this->docs->findByDownloadToken($token);
        if (!$doc) {
            sendError('NOT_FOUND', 'Документ не найден', 404);
        }

        $absPath = $this->docs->getAbsoluteFilePath($doc);
        if ($absPath === null || !is_file($absPath)) {
            $absPath = $this->ensureDocumentFileExists($doc);
        }
        if ($absPath === null || !is_file($absPath)) {
            sendError('NOT_FOUND', 'Файл не найден', 404);
        }

        $this->docs->logDownload((int) $doc['id'], $this->getClientIp(), $this->getUserAgent());

        $filename = !empty($doc['file_name']) ? (string) $doc['file_name'] : basename($absPath);

        if (!headers_sent()) {
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $this->sanitizeFilename($filename) . '"');
            header('Content-Length: ' . filesize($absPath));
            header('X-Content-Type-Options: nosniff');
        }

        readfile($absPath);
        exit;
    }

    /**
     * GET /finance/email-open?token=...
     * Возвращает 1x1 gif и фиксирует факт открытия письма.
     */
    public function emailOpen()
    {
        $token = isset($_GET['token']) ? trim((string) $_GET['token']) : '';
        if ($token !== '' && strlen($token) >= 16) {
            $this->events->markEmailOpenedByToken($token, $this->getClientIp(), $this->getUserAgent());
        }

        // Прозрачный 1x1 gif
        $gif = base64_decode('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');

        if (!headers_sent()) {
            header('Content-Type: image/gif');
            header('Content-Length: ' . strlen($gif));
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
        }

        echo $gif;
        exit;
    }


    public function invoicePlansIndex()
    {
        Auth::requireAuth();
        $rows = $this->plans->all();

        $paymentDueDays = 7;
        foreach ($rows as &$row) {
            $row['items_snapshot'] = json_decode((string)($row['work_items_json'] ?? '[]'), true);
            if (!is_array($row['items_snapshot'])) {
                $row['items_snapshot'] = [];
            }

            $sum = 0;
            foreach ($row['items_snapshot'] as $line) {
                $sum += (float)($line['amount'] ?? 0);
            }

            $row['total_sum'] = $sum;
            $row['period_label'] = sprintf('%02d.%04d', (int)$row['period_month'], (int)$row['period_year']);
            $row['created_date'] = !empty($row['created_at']) ? date('d.m.Y', strtotime($row['created_at'])) : '—';
            $row['sent_date'] = !empty($row['sent_at']) ? date('d.m.Y', strtotime($row['sent_at'])) : '—';
            $row['payment_due_days'] = $paymentDueDays;
            $row['days_since_sent'] = !empty($row['sent_at']) ? (int) floor((time() - strtotime($row['sent_at'])) / 86400) : 0;
            $row['can_send_telegram'] = ((int)($row['send_invoice_telegram'] ?? 0) === 1) && !empty($row['chat_id']);
            $row['can_send_diadoc'] = ((int)($row['send_invoice_diadoc'] ?? 0) === 1);

            $channels = json_decode((string)($row['channels_json'] ?? '{}'), true);
            if (!is_array($channels)) {
                $channels = [];
            }
            if (!empty($channels['email'])) {
                $row['email'] = (string)$channels['email'];
            }
            $row['can_send_telegram'] = !empty($channels['send_telegram']) ? true : $row['can_send_telegram'];
            $row['can_send_diadoc'] = !empty($channels['send_diadoc']) ? true : $row['can_send_diadoc'];
            $row['invoice_download_url'] = !empty($row['invoice_download_token']) ? '/api.php/finance/download?token=' . rawurlencode((string)$row['invoice_download_token']) : null;
            $row['act_download_url'] = !empty($row['act_download_token']) ? '/api.php/finance/download?token=' . rawurlencode((string)$row['act_download_token']) : null;

            // Прогреваем физические тестовые PDF, чтобы ссылки в попапе не отдавали NOT_FOUND.
            if (!empty($row['invoice_file_rel_path'])) {
                $this->ensureDocumentFileExists([
                    'doc_type' => 'invoice',
                    'file_rel_path' => (string)$row['invoice_file_rel_path'],
                    'client_id' => (int)($row['client_id'] ?? 0),
                    'period_month' => (int)($row['period_month'] ?? 0),
                    'period_year' => (int)($row['period_year'] ?? 0),
                    'doc_number' => (string)($row['doc_number'] ?? ''),
                    'total_sum' => (float)($row['total_sum'] ?? 0),
                ]);
            }
            if (!empty($row['act_file_rel_path'])) {
                $this->ensureDocumentFileExists([
                    'doc_type' => 'act',
                    'file_rel_path' => (string)$row['act_file_rel_path'],
                    'client_id' => (int)($row['client_id'] ?? 0),
                    'period_month' => (int)($row['period_month'] ?? 0),
                    'period_year' => (int)($row['period_year'] ?? 0),
                    'doc_number' => '',
                    'total_sum' => (float)($row['total_sum'] ?? 0),
                ]);
            }
        }

        sendJson(['data' => $rows]);
    }

    public function invoicePlansCreate()
    {
        Auth::requireAuth();
        $payload = getJsonPayload();

        $clientId = (int)($payload['client_id'] ?? 0);
        if ($clientId <= 0) {
            sendError('VALIDATION_ERROR', 'Клиент не выбран', 422);
        }

        $sendDate = trim((string)($payload['send_date'] ?? ''));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $sendDate)) {
            $sendDate = date('Y-m-d');
        }

        $periodYear = (int)date('Y', strtotime($sendDate));
        $periodMonth = (int)date('m', strtotime($sendDate));
        $periodLabel = sprintf('%02d.%04d', $periodMonth, $periodYear);

        $items = isset($payload['items_snapshot']) && is_array($payload['items_snapshot']) ? $payload['items_snapshot'] : [];
        $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);
        $channelsJson = json_encode([
            'email' => trim((string)($payload['email'] ?? '')),
            'send_telegram' => !empty($payload['send_telegram']) ? 1 : 0,
            'send_diadoc' => !empty($payload['send_diadoc']) ? 1 : 0,
        ], JSON_UNESCAPED_UNICODE);

        $planId = $this->plans->create($clientId, $periodYear, $periodMonth, $periodLabel, $itemsJson, $channelsJson, $sendDate);
        if ($planId <= 0) {
            sendError('CREATE_FAILED', 'Не удалось создать карточку счета', 500);
        }

        if (!empty($payload['send_now'])) {
            $plan = $this->plans->find($planId);
            if (!$plan) {
                sendError('NOT_FOUND', 'Карточка не найдена', 404);
            }
            $this->performInvoicePlanSend($plan, $planId, $payload);
            return;
        }

        sendJson(['ok' => true, 'id' => $planId]);
    }

    public function invoicePlansUpdate($id)
    {
        Auth::requireAuth();
        $plan = $this->plans->find((int)$id);
        if (!$plan) {
            sendError('NOT_FOUND', 'Карточка не найдена', 404);
        }

        $payload = getJsonPayload();
        $items = isset($payload['items_snapshot']) && is_array($payload['items_snapshot'])
            ? $payload['items_snapshot']
            : json_decode((string)($plan['work_items_json'] ?? '[]'), true);

        $sendDate = trim((string)($payload['send_date'] ?? ($plan['planned_send_date'] ?? '')));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $sendDate)) {
            $sendDate = date('Y-m-d');
        }

        $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);
        $channelsJson = json_encode([
            'email' => trim((string)($payload['email'] ?? $plan['email'] ?? '')),
            'send_telegram' => !empty($payload['send_telegram']) ? 1 : 0,
            'send_diadoc' => !empty($payload['send_diadoc']) ? 1 : 0,
        ], JSON_UNESCAPED_UNICODE);

        $ok = $this->plans->updateEditable((int)$id, $itemsJson, $channelsJson, $sendDate);
        if (!$ok) {
            sendError('UPDATE_FAILED', 'Не удалось сохранить карточку', 500);
        }

        sendJson(['ok' => true]);
    }

    public function invoicePlansDelete($id)
    {
        Auth::requireAuth();
        $ok = $this->plans->delete((int)$id);
        if (!$ok) {
            sendError('DELETE_FAILED', 'Не удалось удалить карточку', 500);
        }
        sendJson(['ok' => true]);
    }

    public function invoicePlansSend($id)
    {
        Auth::requireAuth();
        $plan = $this->plans->find((int)$id);
        if (!$plan) {
            sendError('NOT_FOUND', 'Карточка не найдена', 404);
        }

        $payload = getJsonPayload();
        $this->performInvoicePlanSend($plan, (int)$id, $payload);
    }

    private function performInvoicePlanSend(array $plan, int $id, array $payload)
    {
        $items = isset($payload['items_snapshot']) && is_array($payload['items_snapshot'])
            ? $payload['items_snapshot']
            : json_decode((string)($plan['work_items_json'] ?? '[]'), true);
        if (!is_array($items) || empty($items)) {
            sendError('VALIDATION_ERROR', 'Укажите строки работ', 422);
        }

        $email = isset($payload['email']) ? trim((string)$payload['email']) : (string)$plan['email'];
        $sendTelegram = !empty($payload['send_telegram']) ? 1 : 0;
        $sendDiadoc = !empty($payload['send_diadoc']) ? 1 : 0;

        $total = 0.0;
        foreach ($items as $line) {
            $total += (float)($line['amount'] ?? 0);
        }

        if ($total <= 0) {
            sendError('VALIDATION_ERROR', 'Сумма счета должна быть больше 0', 422);
        }

        $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);
        $channelsJson = json_encode([
            'email' => $email,
            'send_telegram' => $sendTelegram,
            'send_diadoc' => $sendDiadoc
        ], JSON_UNESCAPED_UNICODE);
        $plannedSendDate = trim((string)($payload['send_date'] ?? ($plan['planned_send_date'] ?? date('Y-m-d'))));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $plannedSendDate)) {
            $plannedSendDate = date('Y-m-d');
        }
        $this->plans->updateEditable($id, $itemsJson, $channelsJson, $plannedSendDate);

        $docNumber = 'INV-PLAN-' . date('Ymd') . '-' . $id;
        $token = hash('sha256', $docNumber . '|' . microtime(true));
        $documentId = $this->plans->insertFinanceDocument($plan, $docNumber, $token, $total);
        if ($documentId <= 0) {
            sendError('DOCUMENT_CREATE_FAILED', 'Не удалось создать счет', 500);
        }

        $this->plans->setSent($id, $documentId);

        if ($email !== '') {
            $this->plans->insertSendEvent($documentId, 'email', $email, 'success', null);
        } else {
            $this->plans->insertSendEvent($documentId, 'email', '', 'skipped', 'Email is empty');
        }

        if ($sendTelegram && !empty($plan['chat_id'])) {
            $this->plans->insertSendEvent($documentId, 'telegram', (string)$plan['chat_id'], 'success', null);
        } else {
            $this->plans->insertSendEvent($documentId, 'telegram', (string)($plan['chat_id'] ?? ''), 'skipped', 'Telegram disabled or chat_id empty');
        }

        if ($sendDiadoc && (int)($plan['send_invoice_diadoc'] ?? 0) === 1) {
            $this->plans->insertSendEvent($documentId, 'diadoc', (string)($plan['diadoc_box_id'] ?? ''), 'success', null);
        } else {
            $this->plans->insertSendEvent($documentId, 'diadoc', (string)($plan['diadoc_box_id'] ?? ''), 'skipped', 'Diadoc disabled');
        }

        sendJson(['ok' => true, 'document_id' => $documentId]);
    }

    public function invoicePlansRemind($id)
    {
        Auth::requireAuth();
        $plan = $this->plans->find((int)$id);
        if (!$plan) {
            sendError('NOT_FOUND', 'Карточка не найдена', 404);
        }
        if ($plan['status'] !== 'sent_waiting_payment') {
            sendError('INVALID_STATUS', 'Напоминание доступно только для выставленных счетов', 422);
        }
        $documentId = (int)($plan['document_id'] ?? 0);
        if ($documentId <= 0) {
            sendError('INVALID_DOCUMENT', 'Счет не привязан', 422);
        }

        $channels = json_decode((string)($plan['channels_json'] ?? '{}'), true);
        if (!is_array($channels)) {
            $channels = [];
        }

        $email = isset($channels['email']) ? trim((string)$channels['email']) : (string)$plan['email'];
        if ($email !== '') {
            $this->plans->insertSendEvent($documentId, 'email', $email, 'success', null);
        }
        $sendTelegram = !empty($channels['send_telegram']);
        if ($sendTelegram && !empty($plan['chat_id'])) {
            $this->plans->insertSendEvent($documentId, 'telegram', (string)$plan['chat_id'], 'success', null);
        }

        sendJson(['ok' => true]);
    }
    private function ensureDocumentFileExists(array $doc)
    {
        $docType = isset($doc['doc_type']) ? (string)$doc['doc_type'] : '';
        if ($docType !== 'invoice' && $docType !== 'act') {
            return null;
        }

        $absPath = $this->docs->getAbsoluteFilePath($doc);
        if ($absPath === null) {
            return null;
        }

        $dir = dirname($absPath);
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            return null;
        }

        $clientId = (int)($doc['client_id'] ?? 0);
        $period = sprintf('%02d.%04d', (int)($doc['period_month'] ?? 0), (int)($doc['period_year'] ?? 0));
        $docNumber = (string)($doc['doc_number'] ?? '');
        $sum = isset($doc['total_sum']) ? (float)$doc['total_sum'] : 0.0;

        $lines = [
            $docType === 'invoice' ? 'Тестовый счет' : 'Тестовый акт',
            'Документ сгенерирован автоматически',
            'Номер: ' . ($docNumber !== '' ? $docNumber : '—'),
            'Клиент ID: ' . $clientId,
            'Период: ' . $period,
            'Сумма: ' . number_format($sum, 2, '.', ' ') . ' RUB',
            'Дата: ' . date('d.m.Y H:i')
        ];

        $pdf = $this->buildSimplePdf($lines);
        $ok = @file_put_contents($absPath, $pdf);
        return ($ok !== false && is_file($absPath)) ? $absPath : null;
    }

    private function buildSimplePdf(array $lines)
    {
        $escape = function ($text) {
            $text = (string)$text;
            $text = str_replace('\\', '\\\\', $text);
            $text = str_replace('(', '\\(', $text);
            $text = str_replace(')', '\\)', $text);
            return preg_replace('/[^\x20-\x7E]/', '?', $text);
        };

        $contentLines = [
            'BT',
            '/F1 16 Tf',
            '50 780 Td',
            '(' . $escape(array_shift($lines) ?: 'Test document') . ') Tj',
            '/F1 11 Tf'
        ];

        foreach ($lines as $line) {
            $contentLines[] = '0 -20 Td';
            $contentLines[] = '(' . $escape($line) . ') Tj';
        }
        $contentLines[] = 'ET';

        $stream = implode("
", $contentLines) . "
";

        $objects = [];
        $objects[] = "1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
";
        $objects[] = "2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
";
        $objects[] = "3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
";
        $objects[] = "4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
";
        $objects[] = "5 0 obj
<< /Length " . strlen($stream) . " >>
stream
" . $stream . "endstream
endobj
";

        $pdf = "%PDF-1.4
";
        $offsets = [0];
        foreach ($objects as $obj) {
            $offsets[] = strlen($pdf);
            $pdf .= $obj;
        }

        $xrefPos = strlen($pdf);
        $pdf .= "xref
0 " . (count($objects) + 1) . "
";
        $pdf .= "0000000000 65535 f 
";
        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n 
", $offsets[$i]);
        }
        $pdf .= "trailer
<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>
";
        $pdf .= "startxref
" . $xrefPos . "
%%EOF
";

        return $pdf;
    }

    private function getClientIp()
    {
        $keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        foreach ($keys as $k) {
            if (!empty($_SERVER[$k])) {
                $v = (string) $_SERVER[$k];
                if ($k === 'HTTP_X_FORWARDED_FOR') {
                    $parts = explode(',', $v);
                    $v = trim((string) $parts[0]);
                }
                return substr($v, 0, 191);
            }
        }
        return '';
    }

    private function getUserAgent()
    {
        return isset($_SERVER['HTTP_USER_AGENT']) ? substr((string) $_SERVER['HTTP_USER_AGENT'], 0, 500) : '';
    }

    private function sanitizeFilename($name)
    {
        $name = trim((string) $name);
        if ($name === '') {
            return 'document.pdf';
        }
        $name = preg_replace('/[^a-zA-Z0-9а-яА-Я _.,()-]/u', '_', $name);
        $name = preg_replace('/\\s+/', ' ', $name);
        return substr($name, 0, 180);
    }
}
