<?php

set_time_limit(300);

require_once __DIR__ . '/../config/config.php';
$db = require __DIR__ . '/../app/bootstrap.php';

require_once APP_BASE_PATH . '/app/models/SettingsModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceDocumentModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceSendEventModel.php';

require_once APP_BASE_PATH . '/app/services/FinanceCalendarService.php';
require_once APP_BASE_PATH . '/app/services/FinanceFileStorage.php';
require_once APP_BASE_PATH . '/app/services/Finance/EmailService.php';
require_once APP_BASE_PATH . '/app/services/Finance/TelegramService.php';
require_once APP_BASE_PATH . '/app/services/Finance/DiadocService.php';

/**
 * Важно:
 * Для генерации PDF акта требуется dompdf.
 * Скопируйте папку dompdf из рабочего WP кода:
 * old_code/bStudio_tinkoff_invoice/inc/dompdf
 * в:
 * /app/lib/dompdf
 * и убедитесь что существует файл:
 * /app/lib/dompdf/autoload.inc.php
 */

$LOCK_FILE = sys_get_temp_dir() . '/finance_send_acts.lock';
$lockFp = fopen($LOCK_FILE, 'c+');
if (!$lockFp || !flock($lockFp, LOCK_EX | LOCK_NB)) {
    echo "LOCKED\n";
    exit(0);
}

$MIN_TIME_HHMM = 1000;
$MAX_RETRY_ATTEMPTS = 2;

$nowHHMM = (int) date('Gi');
if ($nowHHMM < $MIN_TIME_HHMM) {
    echo "TIME_DENIED\n";
    exit(0);
}

$today = date('Y-m-d');
$year = (int) date('Y');
$month = (int) date('n');

$endDate = FinanceCalendarService::getAlternativeEndOfMonthDate($month, $year);
if ($today !== $endDate) {
    echo "DATE_DENIED\n";
    exit(0);
}

$settings = (new SettingsModel($db))->get();

$publicUrl = isset($settings['crm_public_url']) ? rtrim((string) $settings['crm_public_url'], '/') : '';
$actPrefix = isset($settings['finance_act_number_prefix']) ? (string) $settings['finance_act_number_prefix'] : 'ACT-';

$emailFrom = isset($settings['finance_email_from_email']) ? (string) $settings['finance_email_from_email'] : '';
$emailFromName = isset($settings['finance_email_from_name']) ? (string) $settings['finance_email_from_name'] : '';
$emailBcc = isset($settings['finance_email_bcc']) ? (string) $settings['finance_email_bcc'] : '';

$emailSubjectTpl = isset($settings['finance_email_subject_act']) ? (string) $settings['finance_email_subject_act'] : 'Акт';
$emailBodyTpl = isset($settings['finance_email_body_act_html']) ? (string) $settings['finance_email_body_act_html'] : '';

$tgBotToken = isset($settings['finance_telegram_bot_token']) ? (string) $settings['finance_telegram_bot_token'] : '';

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

$clientSql = "SELECT id, name, legal_name, inn, kpp, email, additional_email, telegram_id, chat_id,
                    send_act_schedule, send_act_telegram, send_act_diadoc
             FROM clients
             WHERE is_active = 1
               AND send_act_schedule = 1";

$res = $db->query($clientSql);
$clients = [];
while ($row = $res->fetch_assoc()) {
    $clients[] = $row;
}

echo "CLIENTS=" . count($clients) . "\n";

foreach ($clients as $c) {
    $clientId = (int) $c['id'];

    $doc = $docs->findByPeriod('act', $clientId, $year, $month);

    if (!$doc) {
        // Генерируем HTML акта из данных.
        $items = [];
        $sum = 0;

        $stmt = $db->prepare("SELECT service_name, service_amount FROM client_act_items WHERE client_id = ? ORDER BY sort_order ASC, id ASC");
        $stmt->bind_param("i", $clientId);
        $stmt->execute();
        $r = $stmt->get_result();
        while ($it = $r->fetch_assoc()) {
            $amount = (float) $it['service_amount'];
            $items[] = [
                'name' => (string) $it['service_name'],
                'amount' => $amount,
            ];
            $sum += $amount;
        }
        $stmt->close();

        if (!$items) {
            echo "SKIP client_id={$clientId} NO_ITEMS\n";
            continue;
        }

        $orgName = isset($settings['finance_legal_name']) ? (string) $settings['finance_legal_name'] : '';
        $orgInn = isset($settings['finance_legal_inn']) ? (string) $settings['finance_legal_inn'] : '';
        $orgKpp = isset($settings['finance_legal_kpp']) ? (string) $settings['finance_legal_kpp'] : '';
        $orgAddress = isset($settings['finance_legal_address']) ? (string) $settings['finance_legal_address'] : '';
        $orgBank = isset($settings['finance_legal_bank_details']) ? (string) $settings['finance_legal_bank_details'] : '';

        $clientName = $c['legal_name'] ? (string) $c['legal_name'] : (string) $c['name'];

        $actNumber = $actPrefix . sprintf('%04d%02d-%d', $year, $month, $clientId);
        $actDate = date('Y-m-d');

        $html = buildActHtml($orgName, $orgInn, $orgKpp, $orgAddress, $orgBank, $clientName, (string) $c['inn'], (string) $c['kpp'], $actNumber, $actDate, $items, $sum);

        $pdfBytes = renderPdfByDompdf($html);
        if ($pdfBytes === false) {
            echo "DOMPDF_FAIL client_id={$clientId}\n";
            continue;
        }

        $fileName = 'Акт_' . FinanceFileStorage::sanitizeFileName($clientName) . '_' . date('dmY') . '.pdf';
        $saved = FinanceFileStorage::savePdfBytes('act', $year, $month, $fileName, $pdfBytes);

        $downloadToken = bin2hex(random_bytes(24));

        $docId = $docs->insert([
            'doc_type' => 'act',
            'client_id' => $clientId,
            'period_year' => $year,
            'period_month' => $month,
            'doc_number' => $actNumber,
            'doc_date' => $actDate,
            'total_sum' => (float) $sum,
            'currency' => 'RUB',
            'file_rel_path' => $saved['rel_path'],
            'file_name' => $saved['file_name'],
            'file_size' => (int) $saved['size'],
            'file_sha256' => (string) $saved['sha256'],
            'download_token' => $downloadToken,
        ]);

        $doc = $docs->findByPeriod('act', $clientId, $year, $month);
        if (!$doc) {
            echo "DOC_SAVE_FAIL client_id={$clientId}\n";
            continue;
        }

        echo "DOC_CREATED client_id={$clientId} doc_id={$docId}\n";
    } else {
        echo "DOC_EXISTS client_id={$clientId} doc_id={$doc['id']}\n";
    }

    $docId = (int) $doc['id'];
    $absPath = $docs->getAbsoluteFilePath($doc);
    if (!$absPath || !is_file($absPath)) {
        echo "DOC_FILE_MISSING client_id={$clientId} doc_id={$docId}\n";
        continue;
    }

    $downloadUrl = '';
    if ($publicUrl !== '' && !empty($doc['download_token'])) {
        $downloadUrl = $publicUrl . '/api.php/finance/download?token=' . urlencode((string) $doc['download_token']);
    }

    $onlyDiadoc = !empty($c['send_act_diadoc']);

    // Если отмечено отправлять акт в Диадок, то отправляем только в Диадок.
    if ($onlyDiadoc && !empty($c['inn'])) {
        $recipientInn = (string) $c['inn'];
        $ev = $events->getOrCreate($docId, 'diadoc', $recipientInn);

        $attempts = isset($ev['attempts']) ? (int) $ev['attempts'] : 0;
        $status = isset($ev['status']) ? (string) $ev['status'] : 'pending';

        if ($status !== 'success' && $attempts < $MAX_RETRY_ATTEMPTS) {
            $send = $diadoc->sendActPdf(
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
        continue;
    }

    // Email (если есть email).
    $emails = [];
    if (!empty($c['email'])) $emails[] = trim((string) $c['email']);
    if (!empty($c['additional_email'])) $emails[] = trim((string) $c['additional_email']);
    $emails = array_values(array_unique(array_filter($emails)));

    foreach ($emails as $to) {
        $ev = $events->getOrCreate($docId, 'email', $to);

        $attempts = isset($ev['attempts']) ? (int) $ev['attempts'] : 0;
        $status = isset($ev['status']) ? (string) $ev['status'] : 'pending';

        if ($status === 'success') continue;
        if ($attempts >= $MAX_RETRY_ATTEMPTS) continue;

        $openPixelUrl = '';
        if ($publicUrl !== '' && !empty($ev['open_token'])) {
            $openPixelUrl = $publicUrl . '/api.php/finance/email-open?token=' . urlencode((string) $ev['open_token']);
        }

        $body = $emailBodyTpl !== '' ? $emailBodyTpl : '<p>Здравствуйте!</p><p>Акт во вложении.</p><p><a href="{DOWNLOAD_URL}">Скачать акт</a></p><img src="{OPEN_PIXEL_URL}" width="1" height="1" alt="">';

        $vars = [
            '{CLIENT_NAME}' => (string) ($c['name'] ?: $c['legal_name']),
            '{DOC_NUMBER}' => (string) $doc['doc_number'],
            '{DOC_DATE}' => (string) $doc['doc_date'],
            '{PERIOD}' => sprintf('%02d.%04d', $month, $year),
            '{TOTAL_SUM}' => (string) $doc['total_sum'],
            '{DOWNLOAD_URL}' => (string) $downloadUrl,
            '{OPEN_PIXEL_URL}' => (string) $openPixelUrl,
        ];

        $subj = strtr($emailSubjectTpl, $vars);
        $html = strtr($body, $vars);

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

    // Telegram (если включено и заполнен tg id).
    $sendTg = !empty($c['send_act_telegram']);
    $tgChat = '';
    if (!empty($c['chat_id'])) $tgChat = trim((string) $c['chat_id']);
    if ($tgChat === '' && !empty($c['telegram_id'])) $tgChat = trim((string) $c['telegram_id']);

    if ($sendTg && $tgChat !== '') {
        $ev = $events->getOrCreate($docId, 'telegram', $tgChat);

        $attempts = isset($ev['attempts']) ? (int) $ev['attempts'] : 0;
        $status = isset($ev['status']) ? (string) $ev['status'] : 'pending';

        if ($status !== 'success' && $attempts < $MAX_RETRY_ATTEMPTS) {
            $caption = 'Акт. ' . ($downloadUrl !== '' ? $downloadUrl : '');

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
}

echo "DONE\n";

function buildActHtml($orgName, $orgInn, $orgKpp, $orgAddress, $orgBank, $clientName, $clientInn, $clientKpp, $actNumber, $actDate, array $items, $sum)
{
    $rows = '';
    $i = 1;
    foreach ($items as $it) {
        $name = htmlspecialchars((string) $it['name'], ENT_QUOTES, 'UTF-8');
        $amount = number_format((float) $it['amount'], 2, '.', ' ');
        $rows .= "<tr><td style=\"border:1px solid #333;padding:6px;\">{$i}</td><td style=\"border:1px solid #333;padding:6px;\">{$name}</td><td style=\"border:1px solid #333;padding:6px;text-align:right;\">{$amount}</td></tr>";
        $i++;
    }

    $sumFmt = number_format((float) $sum, 2, '.', ' ');

    $orgNameH = htmlspecialchars((string) $orgName, ENT_QUOTES, 'UTF-8');
    $orgInnH = htmlspecialchars((string) $orgInn, ENT_QUOTES, 'UTF-8');
    $orgKppH = htmlspecialchars((string) $orgKpp, ENT_QUOTES, 'UTF-8');
    $orgAddrH = nl2br(htmlspecialchars((string) $orgAddress, ENT_QUOTES, 'UTF-8'));
    $orgBankH = nl2br(htmlspecialchars((string) $orgBank, ENT_QUOTES, 'UTF-8'));

    $clientNameH = htmlspecialchars((string) $clientName, ENT_QUOTES, 'UTF-8');
    $clientInnH = htmlspecialchars((string) $clientInn, ENT_QUOTES, 'UTF-8');
    $clientKppH = htmlspecialchars((string) $clientKpp, ENT_QUOTES, 'UTF-8');

    $actNumberH = htmlspecialchars((string) $actNumber, ENT_QUOTES, 'UTF-8');
    $actDateH = htmlspecialchars((string) $actDate, ENT_QUOTES, 'UTF-8');

    return "
<!DOCTYPE html>
<html lang=\"ru\">
<head>
<meta charset=\"UTF-8\">
<style>
body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; }
h1 { font-size: 16px; margin: 0 0 10px 0; }
.small { font-size: 11px; color: #333; }
.table { border-collapse: collapse; width: 100%; margin-top: 10px; }
</style>
</head>
<body>
<h1>Акт № {$actNumberH} от {$actDateH}</h1>

<div class=\"small\">
<strong>Исполнитель:</strong> {$orgNameH}<br>
ИНН: {$orgInnH} " . ($orgKppH !== '' ? " КПП: {$orgKppH}" : "") . "<br>
{$orgAddrH}<br>
{$orgBankH}
</div>

<br>

<div class=\"small\">
<strong>Заказчик:</strong> {$clientNameH}<br>
ИНН: {$clientInnH} " . ($clientKppH !== '' ? " КПП: {$clientKppH}" : "") . "
</div>

<table class=\"table\">
<thead>
<tr>
<th style=\"border:1px solid #333;padding:6px;width:40px;\">№</th>
<th style=\"border:1px solid #333;padding:6px;\">Наименование услуг</th>
<th style=\"border:1px solid #333;padding:6px;width:120px;\">Сумма</th>
</tr>
</thead>
<tbody>
{$rows}
<tr>
<td colspan=\"2\" style=\"border:1px solid #333;padding:6px;text-align:right;\"><strong>Итого</strong></td>
<td style=\"border:1px solid #333;padding:6px;text-align:right;\"><strong>{$sumFmt}</strong></td>
</tr>
</tbody>
</table>

<br><br>
<table style=\"width:100%;\">
<tr>
<td style=\"width:50%;\">Исполнитель: ___________________</td>
<td style=\"width:50%;\">Заказчик: ___________________</td>
</tr>
</table>

</body>
</html>";
}

function renderPdfByDompdf($html)
{
    $autoload = APP_BASE_PATH . '/app/lib/dompdf/autoload.inc.php';
    if (!is_file($autoload)) {
        return false;
    }

    require_once $autoload;

    if (!class_exists('Dompdf\\Dompdf')) {
        return false;
    }

    $dompdf = new Dompdf\Dompdf(['isRemoteEnabled' => true]);
    $dompdf->loadHtml($html, 'UTF-8');
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();

    return $dompdf->output();
}
