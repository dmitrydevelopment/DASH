<?php

// tools/import_wp_clients.php
// Запуск: php tools/import_wp_clients.php
// Важно: запускать только из CLI.

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit("CLI only\n");
}

require_once __DIR__ . '/../config/config.php';
$crmDb = require __DIR__ . '/../app/bootstrap.php';

require_once APP_BASE_PATH . '/app/models/ClientModel.php';

mysqli_set_charset($crmDb, 'utf8mb4');

function fail(string $msg): void {
    fwrite(STDERR, $msg . "\n");
    exit(1);
}

/**
 * ВАЖНО: укажите доступ к WordPress базе.
 * Можно к той же базе, где лежит WP. Таблицы: wpmq_posts, wpmq_postmeta, wpmq_options.
 */
$wpHost = 'localhost';
$wpUser = 'kostyasw_ksud1';
$wpPass = ')l65p4FS)0';
$wpName = 'kostyasw_ksud1';

$wpDb = new mysqli($wpHost, $wpUser, $wpPass, $wpName);
if ($wpDb->connect_error) {
    fail("WP DB connect error: " . $wpDb->connect_error);
}
mysqli_set_charset($wpDb, 'utf8mb4');

function safeUnserialize($str) {
    if (!is_string($str) || $str === '') return [];
    $data = @unserialize($str, ['allowed_classes' => false]);
    if ($data !== false || $str === 'b:0;') {
        return is_array($data) ? $data : [];
    }

    // Попытка восстановить длины сериализованных строк, если переносили через кривой дамп.
    $fixed = preg_replace_callback('!s:(\d+):"(.*?)";!s', function($m) {
        $len = strlen($m[2]);
        return 's:' . $len . ':"' . $m[2] . '";';
    }, $str);

    $data2 = @unserialize($fixed, ['allowed_classes' => false]);
    return is_array($data2) ? $data2 : [];
}

function str01($v): int {
    if ($v === null) return 0;
    $s = trim((string)$v);
    if ($s === '' || $s === '0' || mb_strtolower($s) === 'no' || mb_strtolower($s) === 'false') return 0;
    return 1;
}

/**
 * Замена кавычек "..." на «...».
 * Делает чередование: первая " -> «, следующая " -> » и так далее.
 */
function normalizeQuotes(string $s): string {
    if ($s === '') return $s;
    $out = '';
    $open = true;
    $len = mb_strlen($s);
    for ($i = 0; $i < $len; $i++) {
        $ch = mb_substr($s, $i, 1);
        if ($ch === '"') {
            $out .= $open ? '«' : '»';
            $open = !$open;
        } else {
            $out .= $ch;
        }
    }
    return $out;
}

echo "Loading telegram_chat_projects from wpmq_options...\n";
$optRes = $wpDb->query("SELECT option_value FROM wpmq_options WHERE option_name = 'telegram_chat_projects' LIMIT 1");
$tgMap = [];
if ($optRes && ($optRow = $optRes->fetch_assoc())) {
    $tgMap = safeUnserialize($optRow['option_value']);
}
if (!is_array($tgMap)) $tgMap = [];

echo "Clearing CRM clients tables...\n";
$crmDb->query("SET FOREIGN_KEY_CHECKS=0");
$crmDb->query("TRUNCATE TABLE client_invoice_items");
$crmDb->query("TRUNCATE TABLE client_act_items");
$crmDb->query("TRUNCATE TABLE clients");
$crmDb->query("SET FOREIGN_KEY_CHECKS=1");

$clientModel = new ClientModel($crmDb);

echo "Selecting WP clients...\n";
$postsSql = "SELECT ID, post_title, post_status FROM wpmq_posts WHERE post_type = 'clients'";
$postsRes = $wpDb->query($postsSql);
if (!$postsRes) {
    fail("WP query error: " . $wpDb->error);
}

$total = 0;
$imported = 0;

$crmDb->begin_transaction();

try {
    while ($p = $postsRes->fetch_assoc()) {
        $total++;

        $wpId = (int)$p['ID'];
        $name = trim((string)$p['post_title']);
        $status = (string)$p['post_status'];
        $isActive = ($status === 'publish') ? 1 : 0;

        // Загружаем meta
        $meta = [];
        $stmtMeta = $wpDb->prepare("SELECT meta_key, meta_value FROM wpmq_postmeta WHERE post_id = ?");
        if (!$stmtMeta) {
            throw new Exception("WP prepare meta failed: " . $wpDb->error);
        }
        $stmtMeta->bind_param('i', $wpId);
        if (!$stmtMeta->execute()) {
            $stmtMeta->close();
            throw new Exception("WP execute meta failed: " . $wpDb->error);
        }
        $resMeta = $stmtMeta->get_result();
        while ($row = $resMeta->fetch_assoc()) {
            $k = (string)$row['meta_key'];
            if ($k === '') continue;
            if (isset($k[0]) && $k[0] === '_') continue; // служебные ACF
            $meta[$k] = $row['meta_value']; // берем последнее значение по ключу
        }
        $stmtMeta->close();

        // Игнорируем служебные
        unset($meta['hystory_payments'], $meta['hystory_payments_new']);
        foreach ($meta as $k => $v) {
            if (strpos($k, 'invoice_opened_mail_') === 0) unset($meta[$k]);
        }

        $legalName = isset($meta['nazvanie_kompanii']) ? trim((string)$meta['nazvanie_kompanii']) : '';
        if ($legalName !== '') {
            $legalName = normalizeQuotes($legalName);
        }

        $email = isset($meta['email']) ? trim((string)$meta['email']) : '';
        $email2 = isset($meta['email_2']) ? trim((string)$meta['email_2']) : '';
        $inn = isset($meta['inn']) ? trim((string)$meta['inn']) : '';
        $kpp = isset($meta['kpp']) ? trim((string)$meta['kpp']) : '';
        $telegramId = isset($meta['telegram_user_id']) ? trim((string)$meta['telegram_user_id']) : '';

        $tgExtra = $tgMap[$wpId] ?? null;
        $chatId = '';
        $trackerProjectId = 0;

        if (is_array($tgExtra)) {
            $chatId = isset($tgExtra['chat_id']) ? (string)$tgExtra['chat_id'] : '';
            $trackerProjectId = isset($tgExtra['project_id']) ? (int)$tgExtra['project_id'] : 0;
        }

        $data = [
            'name' => $name,
            'legal_name' => $legalName !== '' ? $legalName : null,
            'inn' => $inn !== '' ? $inn : null,
            'kpp' => $kpp !== '' ? $kpp : null,
            'contact_person' => $name, // как согласовали
            'email' => $email !== '' ? $email : null,
            'additional_email' => $email2 !== '' ? $email2 : null,
            'phone' => null, // как согласовали
            'industry' => null,
            'website' => null,
            'manager_employee_id' => 0,
            'tracker_project_id' => $trackerProjectId,
            'client_type' => 'support',

            'send_invoice_schedule' => str01($meta['otpravlyat_klientu_schet_po_raspisaniyu'] ?? 0),
            'invoice_use_end_month_date' => str01($meta['ispolzovat_datu_v_konce_mesyaca'] ?? 0),
            'send_invoice_telegram' => str01($meta['send_invoce_to_tg'] ?? 0),
            'send_invoice_diadoc' => str01($meta['send_invoce_to_diadoc_invoce'] ?? 0),
            'send_act_diadoc' => str01($meta['send_invoce_to_diadoc'] ?? 0),

            'telegram_id' => $telegramId !== '' ? $telegramId : null,
            'chat_id' => $chatId !== '' ? $chatId : null,
            'notes' => null,
            'is_active' => $isActive,
        ];

        $crmClientId = $clientModel->create($data);
        if (!$crmClientId) {
            throw new Exception("CRM create client failed for WP ID {$wpId}");
        }

        // Счета: основная строка + дополнительные dopolnitelnye_uslugi_N_*
        $invoiceItems = [];

        $mainInvName = isset($meta['naimenovanie_uslugi']) ? trim((string)$meta['naimenovanie_uslugi']) : '';
        $mainInvPrice = isset($meta['stoimost_uslugi']) ? trim((string)$meta['stoimost_uslugi']) : '';
        if ($mainInvName !== '') {
            $invoiceItems[] = [
                'service_name' => $mainInvName,
                'service_price' => $mainInvPrice !== '' ? $mainInvPrice : '0'
            ];
        }

        $invExtra = []; // idx => ['name'=>..., 'price'=>...]
        foreach ($meta as $k => $v) {
            if (preg_match('/^dopolnitelnye_uslugi_(\d+)_naimenovanie_uslugi_dop$/', $k, $m)) {
                $idx = (int)$m[1];
                $invExtra[$idx]['name'] = trim((string)$v);
            } elseif (preg_match('/^dopolnitelnye_uslugi_(\d+)_stoimost_uslugi_dop$/', $k, $m)) {
                $idx = (int)$m[1];
                $invExtra[$idx]['price'] = trim((string)$v);
            }
        }
        if (!empty($invExtra)) {
            ksort($invExtra);
            foreach ($invExtra as $row) {
                $n = isset($row['name']) ? trim((string)$row['name']) : '';
                if ($n === '') continue;
                $pval = isset($row['price']) ? (string)$row['price'] : '0';
                $invoiceItems[] = [
                    'service_name' => $n,
                    'service_price' => $pval
                ];
            }
        }

        if (!$clientModel->replaceInvoiceItems((int)$crmClientId, $invoiceItems)) {
            throw new Exception("CRM replaceInvoiceItems failed for WP ID {$wpId}");
        }

        // Акты: только основная строка, дополнительные игнорируем (как согласовали)
        $actItems = [];
        $mainActName = isset($meta['nazvanie_uslugi_dlya_generaczii_akta_vypolnennoj_raboty'])
            ? trim((string)$meta['nazvanie_uslugi_dlya_generaczii_akta_vypolnennoj_raboty'])
            : '';
        $mainActSum = isset($meta['summa_dlya_akta_vypolnennoj_raboty'])
            ? trim((string)$meta['summa_dlya_akta_vypolnennoj_raboty'])
            : '';

        if ($mainActName !== '') {
            $actItems[] = [
                'service_name' => $mainActName,
                'service_amount' => $mainActSum !== '' ? $mainActSum : '0'
            ];
        }

        if (!$clientModel->replaceActItems((int)$crmClientId, $actItems)) {
            throw new Exception("CRM replaceActItems failed for WP ID {$wpId}");
        }

        $imported++;
        echo "Imported {$imported}: WP {$wpId} -> CRM {$crmClientId}\n";
    }

    $crmDb->commit();
} catch (Exception $e) {
    $crmDb->rollback();
    fail("Import failed: " . $e->getMessage());
}

echo "Done. Total WP clients: {$total}, imported: {$imported}\n";
