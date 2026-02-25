<?php

set_time_limit(300);

require_once __DIR__ . '/../config/config.php';
$db = require __DIR__ . '/../app/bootstrap.php';

require_once APP_BASE_PATH . '/app/models/SettingsModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceDocumentModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceSendEventModel.php';
require_once APP_BASE_PATH . '/app/models/InvoicePlanModel.php';

require_once APP_BASE_PATH . '/app/services/FinanceCalendarService.php';
require_once APP_BASE_PATH . '/app/services/FinanceFileStorage.php';
require_once APP_BASE_PATH . '/app/services/Finance/EmailService.php';
require_once APP_BASE_PATH . '/app/services/Finance/TelegramService.php';
require_once APP_BASE_PATH . '/app/services/Finance/TBankService.php';
require_once APP_BASE_PATH . '/app/services/Finance/DiadocService.php';

$LOCK_FILE = sys_get_temp_dir() . '/finance_send_invoices.lock';
$lockFp = fopen($LOCK_FILE, 'c+');
if (!$lockFp || !flock($lockFp, LOCK_EX | LOCK_NB)) {
    echo "LOCKED\n";
    exit(0);
}

/**
 * Настраиваемые константы в начале файла (по требованиям).
 */
$MIN_TIME_HHMM = 1000;       // раньше этого времени cron не отрабатывает
$MAX_RETRY_ATTEMPTS = 2;     // 1 попытка + 1 догоняющая попытка

$nowHHMM = (int) date('Gi');
if ($nowHHMM < $MIN_TIME_HHMM) {
    echo "TIME_DENIED\n";
    exit(0);
}

$today = date('Y-m-d');
$year = (int) date('Y');
$month = (int) date('n');

$startDate = FinanceCalendarService::getFirstWorkdayOfMonth($month, $year);
$endDate = FinanceCalendarService::getAlternativeEndOfMonthDate($month, $year);

if ($today !== $startDate && $today !== $endDate) {
    echo "DATE_DENIED\n";
    exit(0);
}

$isEndMode = ($today === $endDate) ? 1 : 0;

$settings = (new SettingsModel($db))->get();

$publicUrl = isset($settings['crm_public_url']) ? rtrim((string) $settings['crm_public_url'], '/') : '';
$invoicePrefix = isset($settings['finance_invoice_number_prefix']) ? (string) $settings['finance_invoice_number_prefix'] : 'INV-';
$dueDays = isset($settings['finance_tbank_invoice_due_days']) ? (int) $settings['finance_tbank_invoice_due_days'] : 3;

$unitDefault = isset($settings['finance_tbank_unit_default']) ? (string) $settings['finance_tbank_unit_default'] : 'Шт';
$vatDefault = isset($settings['finance_tbank_vat_default']) ? (string) $settings['finance_tbank_vat_default'] : 'None';

$emailFrom = isset($settings['finance_email_from_email']) ? (string) $settings['finance_email_from_email'] : '';
$emailFromName = isset($settings['finance_email_from_name']) ? (string) $settings['finance_email_from_name'] : '';
$emailBcc = isset($settings['finance_email_bcc']) ? (string) $settings['finance_email_bcc'] : '';

$emailSubjectTpl = isset($settings['finance_email_subject_invoice']) ? (string) $settings['finance_email_subject_invoice'] : 'Счет на оплату';
$emailBodyTpl = isset($settings['finance_email_body_invoice_html']) ? (string) $settings['finance_email_body_invoice_html'] : '';

$tgBotToken = isset($settings['finance_telegram_bot_token']) ? (string) $settings['finance_telegram_bot_token'] : '';
$tgMessageTpl = isset($settings['telegram_default_message_invoice']) ? (string) $settings['telegram_default_message_invoice'] : 'Счет на оплату. {DOWNLOAD_URL}';

$tbankToken = isset($settings['tinkoff_business_token']) ? (string) $settings['tinkoff_business_token'] : '';
$tbank = new TBankService($tbankToken);

$diadoc = new DiadocService(
    isset($settings['finance_diadoc_api_client_id']) ? (string) $settings['finance_diadoc_api_client_id'] : '',
    isset($settings['finance_diadoc_login']) ? (string) $settings['finance_diadoc_login'] : '',
    isset($settings['finance_diadoc_password']) ? (string) $settings['finance_diadoc_password'] : '',
    isset($settings['finance_diadoc_from_box_id']) ? (string) $settings['finance_diadoc_from_box_id'] : ''
);

$emailSvc = new EmailService($emailFrom, $emailFromName, $emailBcc);
$tgSvc = new TelegramService($tgBotToken);

$docs = new FinanceDocumentModel($db);
$events = new FinanceSendEventModel($db);
$plans = new InvoicePlanModel($db);

$clientSql = "SELECT id, name, legal_name, inn, kpp, email, additional_email, telegram_id, chat_id,
                    send_invoice_schedule, invoice_use_end_month_date, send_invoice_telegram, send_invoice_diadoc
             FROM clients
             WHERE is_active = 1
               AND send_invoice_schedule = 1
               AND COALESCE(invoice_use_end_month_date, 0) = ?";

$stmt = $db->prepare($clientSql);
$stmt->bind_param("i", $isEndMode);
$stmt->execute();
$res = $stmt->get_result();

$clients = [];
while ($row = $res->fetch_assoc()) {
    $clients[] = $row;
}
$stmt->close();

echo "CLIENTS=" . count($clients) . "\n";

foreach ($clients as $c) {
    $clientId = (int) $c['id'];

    // 1) Получаем или создаем документ.
    $doc = $docs->findByPeriod('invoice', $clientId, $year, $month);

    if (!$doc) {
        $items = [];
        $sum = 0;

        $stmt = $db->prepare("SELECT service_name, service_price FROM client_invoice_items WHERE client_id = ? ORDER BY sort_order ASC, id ASC");
        $stmt->bind_param("i", $clientId);
        $stmt->execute();
        $r = $stmt->get_result();
        while ($it = $r->fetch_assoc()) {
            $price = (float) $it['service_price'];
            $items[] = [
                'name' => (string) $it['service_name'],
                'price' => (int) round($price),
                'unit' => $unitDefault,
                'vat' => $vatDefault,
                'amount' => 1,
            ];
            $sum += (float) $price;
        }
        $stmt->close();

        if (!$items) {
            echo "SKIP client_id={$clientId} NO_ITEMS\n";
            continue;
        }

        $payerName = $c['legal_name'] ? (string) $c['legal_name'] : (string) $c['name'];
        $inn = (string) $c['inn'];
        $kpp = (string) $c['kpp'];

        $invoiceNumber = $invoicePrefix . sprintf('%04d%02d-%d', $year, $month, $clientId);

        $invoiceDate = date('Y-m-d');
        $dueDate = date('Y-m-d', time() + max(0, $dueDays) * 86400);

        $payload = [
            'invoiceNumber' => (string) $invoiceNumber,
            'invoiceDate' => (string) $invoiceDate,
            'dueDate' => (string) $dueDate,
            'payer' => [
                'name' => (string) $payerName,
                'inn' => (string) $inn,
            ],
            'items' => $items,
        ];

        if ($kpp !== '') {
            $payload['payer']['kpp'] = (string) $kpp;
        }

        $firstEmail = trim((string) $c['email']);
        if ($firstEmail !== '') {
            $payload['contacts'] = [['email' => $firstEmail]];
        }

        $create = $tbank->createInvoice($payload);
        if (!$create[0]) {
            echo "TBANK_FAIL client_id={$clientId} err={$create[1]}\n";
            continue;
        }

        $tb = $create[2];
        $invoiceId = isset($tb['invoiceId']) ? (string) $tb['invoiceId'] : '';
        $pdfUrl = isset($tb['pdfUrl']) ? (string) $tb['pdfUrl'] : '';

        if ($pdfUrl === '') {
            echo "TBANK_BAD_RESPONSE client_id={$clientId}\n";
            continue;
        }

        $pdfBytes = file_get_contents($pdfUrl);
        if ($pdfBytes === false) {
            echo "PDF_DOWNLOAD_FAIL client_id={$clientId}\n";
            continue;
        }

        $fileName = 'Счет_' . FinanceFileStorage::sanitizeFileName($payerName) . '_' . date('dmY') . '.pdf';
        $saved = FinanceFileStorage::savePdfBytes('invoice', $year, $month, $fileName, $pdfBytes);

        $downloadToken = bin2hex(random_bytes(24));

        $docId = $docs->insert([
            'doc_type' => 'invoice',
            'client_id' => $clientId,
            'period_year' => $year,
            'period_month' => $month,
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

        $doc = $docs->findByPeriod('invoice', $clientId, $year, $month);
        if (!$doc) {
            echo "DOC_SAVE_FAIL client_id={$clientId}\n";
            continue;
        }

        echo "DOC_CREATED client_id={$clientId} doc_id={$docId}\n";
    } else {
        echo "DOC_EXISTS client_id={$clientId} doc_id={$doc['id']}\n";
    }

    $docId = (int) $doc['id'];
    $planId = $plans->ensurePlanByDocument($doc, $c);
    if ($planId > 0) {
        echo "PLAN_SYNC_OK client_id={$clientId} plan_id={$planId} doc_id={$docId}\n";
    } else {
        echo "PLAN_SYNC_FAIL client_id={$clientId} doc_id={$docId}\n";
    }

    $absPath = $docs->getAbsoluteFilePath($doc);
    if (!$absPath || !is_file($absPath)) {
        echo "DOC_FILE_MISSING client_id={$clientId} doc_id={$docId}\n";
        continue;
    }

    $downloadUrl = '';
    if ($publicUrl !== '' && !empty($doc['download_token'])) {
        $downloadUrl = $publicUrl . '/api.php/finance/download?token=' . urlencode((string) $doc['download_token']);
    }

    // 2) Email (в любом случае если есть email).
    $emails = [];
    if (!empty($c['email'])) $emails[] = trim((string) $c['email']);
    if (!empty($c['additional_email'])) $emails[] = trim((string) $c['additional_email']);
    $emails = array_values(array_unique(array_filter($emails)));

    foreach ($emails as $to) {
        $ev = $events->getOrCreate($docId, 'email', $to);

        $attempts = isset($ev['attempts']) ? (int) $ev['attempts'] : 0;
        $status = isset($ev['status']) ? (string) $ev['status'] : 'pending';

        if ($status === 'success') {
            continue;
        }
        if ($attempts >= $MAX_RETRY_ATTEMPTS) {
            continue;
        }

        $openPixelUrl = '';
        if ($publicUrl !== '' && !empty($ev['open_token'])) {
            $openPixelUrl = $publicUrl . '/api.php/finance/email-open?token=' . urlencode((string) $ev['open_token']);
        }

        $body = $emailBodyTpl !== '' ? $emailBodyTpl : '<p>Здравствуйте!</p><p>Счет во вложении.</p><p><a href="{DOWNLOAD_URL}">Скачать счет</a></p><img src="{OPEN_PIXEL_URL}" width="1" height="1" alt="">';

        $vars = [
            '{CLIENT_NAME}' => (string) ($c['name'] ?: $c['legal_name']),
            '{DOC_NUMBER}' => (string) $doc['doc_number'],
            '{DOC_DATE}' => (string) $doc['doc_date'],
            '{PERIOD}' => sprintf('%02d.%04d', $month, $year),
            '{TOTAL_SUM}' => (string) $doc['total_sum'],
            '{DOWNLOAD_URL}' => (string) $downloadUrl,
            '{OPEN_PIXEL_URL}' => (string) $openPixelUrl,
        ];

        $subj = $emailSubjectTpl;
        $html = strtr($body, $vars);
        $subj = strtr($subj, $vars);

        $send = $emailSvc->send($to, $subj, $html, [
            ['path' => $absPath, 'name' => basename($absPath), 'type' => 'application/pdf'],
        ]);

        if ($send[0]) {
            $events->markSuccess((int) $ev['id'], '');
            echo "EMAIL_OK client_id={$clientId} to={$to}\n";
        } else {
            $events->markFail((int) $ev['id'], $send[1], '');
            echo "EMAIL_FAIL client_id={$clientId} to={$to} err={$send[1]}\n";
        }
    }

    // 3) Telegram (если включено и заполнен tg id).
    $sendTg = !empty($c['send_invoice_telegram']);
    $tgChat = '';
    if (!empty($c['chat_id'])) $tgChat = trim((string) $c['chat_id']);
    if ($tgChat === '' && !empty($c['telegram_id'])) $tgChat = trim((string) $c['telegram_id']);

    if ($sendTg && $tgChat !== '') {
        $ev = $events->getOrCreate($docId, 'telegram', $tgChat);

        $attempts = isset($ev['attempts']) ? (int) $ev['attempts'] : 0;
        $status = isset($ev['status']) ? (string) $ev['status'] : 'pending';

        if ($status !== 'success' && $attempts < $MAX_RETRY_ATTEMPTS) {
            $caption = $tgMessageTpl;
            $caption = strtr($caption, [
                '{CLIENT_NAME}' => (string) ($c['name'] ?: $c['legal_name']),
                '{DOC_NUMBER}' => (string) $doc['doc_number'],
                '{DOC_DATE}' => (string) $doc['doc_date'],
                '{PERIOD}' => sprintf('%02d.%04d', $month, $year),
                '{TOTAL_SUM}' => (string) $doc['total_sum'],
                '{DOWNLOAD_URL}' => (string) $downloadUrl,
            ]);

            $send = $tgSvc->sendDocument($tgChat, $absPath, $caption);

            if ($send[0]) {
                $events->markSuccess((int) $ev['id'], is_string($send[2]) ? $send[2] : '');
                echo "TG_OK client_id={$clientId}\n";
            } else {
                $events->markFail((int) $ev['id'], $send[1], is_string($send[2]) ? $send[2] : '');
                echo "TG_FAIL client_id={$clientId} err={$send[1]}\n";
            }
        }
    }

    // 4) Diadoc (опционально дополнительно).
    if (!empty($c['send_invoice_diadoc']) && !empty($c['inn'])) {
        $recipientInn = (string) $c['inn'];
        $ev = $events->getOrCreate($docId, 'diadoc', $recipientInn);

        $attempts = isset($ev['attempts']) ? (int) $ev['attempts'] : 0;
        $status = isset($ev['status']) ? (string) $ev['status'] : 'pending';

        if ($status !== 'success' && $attempts < $MAX_RETRY_ATTEMPTS) {
            $send = $diadoc->sendInvoicePdf(
                $recipientInn,
                (string) (isset($doc['file_name']) ? $doc['file_name'] : basename($absPath)),
                $absPath,
                (string) $doc['doc_date'],
                (int) round((float) $doc['total_sum']),
                (string) $doc['doc_number']
            );

            if ($send[0]) {
                $events->markSuccess((int) $ev['id'], is_string($send[2]) ? $send[2] : '');
                echo "DIADOC_OK client_id={$clientId}\n";
            } else {
                $events->markFail((int) $ev['id'], $send[1], is_string($send[2]) ? $send[2] : '');
                echo "DIADOC_FAIL client_id={$clientId} err={$send[1]}\n";
            }
        }
    }
}

echo "DONE\n";
