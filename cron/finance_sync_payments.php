<?php

set_time_limit(300);

require_once __DIR__ . '/../config/config.php';
$db = require __DIR__ . '/../app/bootstrap.php';

require_once APP_BASE_PATH . '/app/models/SettingsModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceDocumentModel.php';
require_once APP_BASE_PATH . '/app/services/Finance/TBankService.php';

$LOCK_FILE = sys_get_temp_dir() . '/finance_sync_payments.lock';
$lockFp = fopen($LOCK_FILE, 'c+');
if (!$lockFp || !flock($lockFp, LOCK_EX | LOCK_NB)) {
    echo "LOCKED\n";
    exit(0);
}

/**
 * Настраиваемые константы в начале файла.
 */
$DAYS_BACK = 60;
$PAGE_LIMIT = 30;

$settings = (new SettingsModel($db))->get();
$accountNumber = isset($settings['finance_tbank_account_number']) ? (string) $settings['finance_tbank_account_number'] : '';
$tbankToken = isset($settings['tinkoff_business_token']) ? (string) $settings['tinkoff_business_token'] : '';

if ($accountNumber === '' || $tbankToken === '') {
    echo "SETTINGS_MISSING\n";
    exit(1);
}

$tbank = new TBankService($tbankToken);
$docs = new FinanceDocumentModel($db);

$to = date('Y-m-d');
$from = date('Y-m-d', time() - $DAYS_BACK * 86400);

$cursor = loadCursor($db);

$totalOps = 0;
$page = 0;

while (true) {
    $page++;

    $resp = $tbank->getStatement($accountNumber, $from, $to, $cursor);
    if (!$resp[0]) {
        echo "TBANK_FAIL err={$resp[1]}\n";
        break;
    }

    $data = $resp[2];
    if (!is_array($data)) {
        echo "TBANK_BAD_JSON\n";
        break;
    }

    $operations = [];
    if (isset($data['operations']) && is_array($data['operations'])) {
        $operations = $data['operations'];
    }

    $nextCursor = isset($data['nextCursor']) ? (string) $data['nextCursor'] : '';
    if ($operations) {
        foreach ($operations as $op) {
            $ok = saveOperation($db, $op);
            if ($ok) {
                $totalOps++;
                tryMatchPaymentToInvoice($db, $docs, $op);
            }
        }
    }

    if ($nextCursor === '' || $nextCursor === $cursor) {
        break;
    }

    $cursor = $nextCursor;
    saveCursor($db, $cursor);

    if ($page >= $PAGE_LIMIT) {
        break;
    }
}

echo "OPS_SAVED={$totalOps}\n";
echo "DONE\n";

function loadCursor(mysqli $db)
{
    if (!tableExists($db, 'finance_sync_state')) return '';

    $res = $db->query("SELECT tbank_cursor FROM finance_sync_state WHERE id = 1 LIMIT 1");
    if ($res && $row = $res->fetch_assoc()) {
        $res->close();
        return (string) $row['tbank_cursor'];
    }
    if ($res) $res->close();
    return '';
}

function saveCursor(mysqli $db, $cursor)
{
    if (!tableExists($db, 'finance_sync_state')) return;

    $cursor = (string) $cursor;
    $now = date('Y-m-d H:i:s');

    $res = $db->query("SELECT id FROM finance_sync_state WHERE id = 1 LIMIT 1");
    $exists = $res && $res->num_rows > 0;
    if ($res) $res->close();

    if ($exists) {
        $stmt = $db->prepare("UPDATE finance_sync_state SET tbank_cursor = ?, last_run_at = ? WHERE id = 1");
        $stmt->bind_param("ss", $cursor, $now);
        $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $db->prepare("INSERT INTO finance_sync_state (id, tbank_cursor, last_run_at) VALUES (1, ?, ?)");
        $stmt->bind_param("ss", $cursor, $now);
        $stmt->execute();
        $stmt->close();
    }
}

function saveOperation(mysqli $db, array $op)
{
    if (!tableExists($db, 'finance_bank_operations')) {
        return false;
    }

    $operationId = isset($op['operationId']) ? (string) $op['operationId'] : '';
    if ($operationId === '') {
        return false;
    }

    $json = json_encode($op, JSON_UNESCAPED_UNICODE);
    $occurredAt = isset($op['operationDate']) ? (string) $op['operationDate'] : '';
    if ($occurredAt === '') {
        $occurredAt = date('Y-m-d H:i:s');
    }

    $amount = 0.0;
    if (isset($op['amount'])) $amount = (float) $op['amount'];

    $currency = isset($op['currency']) ? (string) $op['currency'] : 'RUB';

    $purpose = '';
    if (isset($op['paymentPurpose'])) $purpose = (string) $op['paymentPurpose'];

    $stmt = $db->prepare("INSERT IGNORE INTO finance_bank_operations (operation_id, operation_time, amount, currency, description, raw_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $createdAt = date('Y-m-d H:i:s');
    $stmt->bind_param("ssdssss", $operationId, $occurredAt, $amount, $currency, $purpose, $json, $createdAt);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    return $affected > 0;
}

function tryMatchPaymentToInvoice(mysqli $db, FinanceDocumentModel $docs, array $op)
{
    // Базовый матчинг: paymentPurpose содержит номер счета.
    $purpose = isset($op['paymentPurpose']) ? (string) $op['paymentPurpose'] : '';
    $amount = isset($op['amount']) ? (float) $op['amount'] : 0.0;

    if ($purpose === '' || $amount <= 0) {
        return;
    }

    // Находим кандидатов: последние 6 месяцев, только invoice.
    // Упрощенно: ищем doc_number как подстроку в purpose.
    $stmt = $db->prepare("SELECT id, doc_number, total_sum FROM finance_documents WHERE doc_type = 'invoice' AND is_paid = 0 ORDER BY id DESC LIMIT 200");
    $stmt->execute();
    $res = $stmt->get_result();

    while ($row = $res->fetch_assoc()) {
        $docNumber = (string) $row['doc_number'];
        if ($docNumber === '') continue;

        if (mb_stripos($purpose, $docNumber) !== false) {
            $docId = (int) $row['id'];
            $paidAt = isset($op['operationDate']) ? (string) $op['operationDate'] : date('Y-m-d H:i:s');

            $docs->updateById($docId, [
                'is_paid' => 1,
                'paid_at' => $paidAt,
                'paid_sum' => $amount,
            ]);

            echo "PAID_MATCH doc_id={$docId} number={$docNumber}\n";
            break;
        }
    }

    $stmt->close();
}

function tableExists(mysqli $db, $table)
{
    $table = $db->real_escape_string($table);
    $res = $db->query("SHOW TABLES LIKE '{$table}'");
    $ok = $res && $res->num_rows > 0;
    if ($res) $res->close();
    return $ok;
}
