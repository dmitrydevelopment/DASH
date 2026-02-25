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
    saveSyncState($db, '', 'SETTINGS_MISSING');
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
$syncError = '';

while (true) {
    $page++;

    $resp = $tbank->getStatement($accountNumber, $from, $to, $cursor);
    if (!$resp[0]) {
        $syncError = "TBANK_FAIL err={$resp[1]}";
        echo $syncError . "\n";
        break;
    }

    $data = $resp[2];
    if (!is_array($data)) {
        $syncError = 'TBANK_BAD_JSON';
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
            $savedOpId = saveOperation($db, $op);
            if ($savedOpId !== '') {
                $totalOps++;
                tryMatchPaymentToInvoice($db, $docs, $savedOpId);
            }
        }
    }

    if ($nextCursor === '' || $nextCursor === $cursor) {
        break;
    }

    $cursor = $nextCursor;
    saveSyncState($db, $cursor, '');

    if ($page >= $PAGE_LIMIT) {
        break;
    }
}

saveSyncState($db, $cursor, $syncError);

echo "OPS_SAVED={$totalOps}\n";
echo "DONE\n";

function loadCursor(mysqli $db)
{
    if (!tableExists($db, 'finance_sync_state')) return '';

    $hasTbankCursor = columnExists($db, 'finance_sync_state', 'tbank_cursor');
    $col = $hasTbankCursor ? 'tbank_cursor' : 'last_cursor';
    $res = $db->query("SELECT {$col} AS sync_cursor FROM finance_sync_state WHERE id = 1 LIMIT 1");
    if ($res && $row = $res->fetch_assoc()) {
        $res->close();
        return (string) ($row['sync_cursor'] ?? '');
    }
    if ($res) $res->close();
    return '';
}

function saveSyncState(mysqli $db, $cursor, $lastError = '')
{
    if (!tableExists($db, 'finance_sync_state')) return;

    $cursor = (string) $cursor;
    $now = date('Y-m-d H:i:s');
    $hasTbankCursor = columnExists($db, 'finance_sync_state', 'tbank_cursor');
    $cursorCol = $hasTbankCursor ? 'tbank_cursor' : 'last_cursor';

    $res = $db->query("SELECT id FROM finance_sync_state WHERE id = 1 LIMIT 1");
    $exists = $res && $res->num_rows > 0;
    if ($res) $res->close();

    if ($exists) {
        $sets = ["{$cursorCol} = ?"];
        $types = 's';
        $values = [$cursor];
        if (columnExists($db, 'finance_sync_state', 'last_error')) {
            $sets[] = "last_error = ?";
            $types .= 's';
            $values[] = (string)$lastError;
        }
        if (columnExists($db, 'finance_sync_state', 'last_run_at')) {
            $sets[] = "last_run_at = ?";
            $types .= 's';
            $values[] = $now;
        } elseif (columnExists($db, 'finance_sync_state', 'updated_at')) {
            $sets[] = "updated_at = ?";
            $types .= 's';
            $values[] = $now;
        }
        $stmt = $db->prepare("UPDATE finance_sync_state SET " . implode(', ', $sets) . " WHERE id = 1");
        bindStmtDynamic($stmt, $types, $values);
        $stmt->execute();
        $stmt->close();
    } else {
        $fields = ['id', $cursorCol];
        $types = 'is';
        $values = [1, $cursor];
        if (columnExists($db, 'finance_sync_state', 'last_error')) {
            $fields[] = 'last_error';
            $types .= 's';
            $values[] = (string)$lastError;
        }
        if (columnExists($db, 'finance_sync_state', 'last_run_at')) {
            $fields[] = 'last_run_at';
            $types .= 's';
            $values[] = $now;
        } elseif (columnExists($db, 'finance_sync_state', 'updated_at')) {
            $fields[] = 'updated_at';
            $types .= 's';
            $values[] = $now;
        }
        $stmt = $db->prepare("INSERT INTO finance_sync_state (" . implode(',', $fields) . ") VALUES (" . implode(',', array_fill(0, count($fields), '?')) . ")");
        bindStmtDynamic($stmt, $types, $values);
        $stmt->execute();
        $stmt->close();
    }
}

function saveOperation(mysqli $db, array $op)
{
    if (!tableExists($db, 'finance_bank_operations')) {
        return '';
    }

    $direction = strtolower(trim((string)($op['operationType'] ?? $op['direction'] ?? $op['type'] ?? '')));
    if ($direction !== '') {
        $isIncome = (strpos($direction, 'credit') !== false || strpos($direction, 'income') !== false || strpos($direction, 'in') === 0 || strpos($direction, 'приход') !== false);
        if (!$isIncome) {
            return '';
        }
    }

    $amountRaw = $op['amount'] ?? null;
    if (is_array($amountRaw)) {
        $amountRaw = $amountRaw['value'] ?? $amountRaw['amount'] ?? null;
    }
    $amount = (float)$amountRaw;
    if ($amount <= 0) {
        return '';
    }

    $json = json_encode($op, JSON_UNESCAPED_UNICODE);
    $operationTime = isset($op['operationDate']) ? (string) $op['operationDate'] : '';
    if ($operationTime === '') {
        $operationTime = isset($op['operationTime']) ? (string)$op['operationTime'] : date('Y-m-d H:i:s');
    }
    $operationTime = normalizeDateTimeValue($operationTime);

    $currency = isset($op['currency']) ? (string) $op['currency'] : 'RUB';

    $description = isset($op['paymentPurpose']) ? (string) $op['paymentPurpose'] : '';
    $accountNumber = isset($op['accountNumber']) ? (string)$op['accountNumber'] : '';
    $counterpartyName = isset($op['counterpartyName']) ? (string)$op['counterpartyName'] : (isset($op['payerName']) ? (string)$op['payerName'] : '');
    $counterpartyInn = isset($op['counterpartyInn']) ? (string)$op['counterpartyInn'] : (isset($op['payerInn']) ? (string)$op['payerInn'] : '');
    $operationId = resolveOperationId($op, $operationTime, $amount, $currency, $accountNumber, $description, $counterpartyName, $counterpartyInn);
    if ($operationId === '') {
        return '';
    }

    $createdAt = date('Y-m-d H:i:s');
    $fields = ['operation_id', 'amount', 'currency', 'raw_json'];
    $types = 'sdss';
    $values = [$operationId, $amount, $currency, $json];
    if (columnExists($db, 'finance_bank_operations', 'operation_time')) {
        $fields[] = 'operation_time';
        $types .= 's';
        $values[] = $operationTime;
    }
    if (columnExists($db, 'finance_bank_operations', 'occurred_at')) {
        $fields[] = 'occurred_at';
        $types .= 's';
        $values[] = $operationTime;
    }
    if (columnExists($db, 'finance_bank_operations', 'description')) {
        $fields[] = 'description';
        $types .= 's';
        $values[] = $description;
    }
    if (columnExists($db, 'finance_bank_operations', 'purpose')) {
        $fields[] = 'purpose';
        $types .= 's';
        $values[] = $description;
    }
    if (columnExists($db, 'finance_bank_operations', 'account_number')) {
        $fields[] = 'account_number';
        $types .= 's';
        $values[] = $accountNumber;
    }
    if (columnExists($db, 'finance_bank_operations', 'counterparty_name')) {
        $fields[] = 'counterparty_name';
        $types .= 's';
        $values[] = $counterpartyName;
    }
    if (columnExists($db, 'finance_bank_operations', 'counterparty_inn')) {
        $fields[] = 'counterparty_inn';
        $types .= 's';
        $values[] = $counterpartyInn;
    }
    if (columnExists($db, 'finance_bank_operations', 'created_at')) {
        $fields[] = 'created_at';
        $types .= 's';
        $values[] = $createdAt;
    }

    $update = [];
    foreach ($fields as $f) {
        if ($f === 'operation_id' || $f === 'created_at') continue;
        $update[] = "{$f} = VALUES({$f})";
    }
    $sql = "INSERT INTO finance_bank_operations (" . implode(',', $fields) . ")
            VALUES (" . implode(',', array_fill(0, count($fields), '?')) . ")
            ON DUPLICATE KEY UPDATE " . implode(', ', $update);
    $stmt = $db->prepare($sql);
    bindStmtDynamic($stmt, $types, $values);
    $stmt->execute();
    $stmt->close();

    return $operationId;
}

function tryMatchPaymentToInvoice(mysqli $db, FinanceDocumentModel $docs, $operationId)
{
    $operationId = (string)$operationId;
    if ($operationId === '') {
        return;
    }

    $timeCol = columnExists($db, 'finance_bank_operations', 'operation_time') ? 'operation_time' : (columnExists($db, 'finance_bank_operations', 'occurred_at') ? 'occurred_at' : 'created_at');
    $descCol = columnExists($db, 'finance_bank_operations', 'description') ? 'description' : (columnExists($db, 'finance_bank_operations', 'purpose') ? 'purpose' : "''");
    $innCol = columnExists($db, 'finance_bank_operations', 'counterparty_inn') ? 'counterparty_inn' : "''";
    $stmt = $db->prepare("SELECT operation_id, amount, $timeCol AS operation_time, $descCol AS description, $innCol AS counterparty_inn, matched_document_id
                          FROM finance_bank_operations
                          WHERE operation_id = ?
                          LIMIT 1");
    $stmt->bind_param('s', $operationId);
    $stmt->execute();
    $res = $stmt->get_result();
    $op = $res ? $res->fetch_assoc() : null;
    $stmt->close();
    if (!$op) return;
    if ((int)($op['matched_document_id'] ?? 0) > 0) return;

    $purpose = (string)($op['description'] ?? '');
    $amount = (float)($op['amount'] ?? 0);
    $inn = trim((string)($op['counterparty_inn'] ?? ''));
    $paidAt = !empty($op['operation_time']) ? (string)$op['operation_time'] : date('Y-m-d H:i:s');

    // 1) Match by invoice number in purpose (only unique candidate).
    if ($purpose !== '') {
        $stmt = $db->prepare("SELECT id, doc_number
                              FROM finance_documents
                              WHERE doc_type = 'invoice'
                                AND COALESCE(is_paid, 0) = 0
                                AND ? LIKE CONCAT('%', doc_number, '%')
                              ORDER BY id DESC
                              LIMIT 2");
        $stmt->bind_param('s', $purpose);
        $stmt->execute();
        $res = $stmt->get_result();
        $ids = [];
        while ($res && ($row = $res->fetch_assoc())) $ids[] = (int)$row['id'];
        $stmt->close();
        if (count($ids) === 1) {
            applyOperationToDocument($db, $docs, $operationId, $ids[0], $amount, $paidAt, 'doc_number');
            return;
        }
    }

    // 2) Match by INN + exact amount only when unique.
    if ($inn !== '' && $amount > 0) {
        $stmt = $db->prepare("SELECT d.id
                              FROM finance_documents d
                              INNER JOIN clients c ON c.id = d.client_id
                              WHERE d.doc_type = 'invoice'
                                AND COALESCE(d.is_paid, 0) = 0
                                AND c.inn = ?
                                AND ABS(d.total_sum - ?) < 0.01
                              ORDER BY d.id DESC
                              LIMIT 2");
        $stmt->bind_param('sd', $inn, $amount);
        $stmt->execute();
        $res = $stmt->get_result();
        $ids = [];
        while ($res && ($row = $res->fetch_assoc())) $ids[] = (int)$row['id'];
        $stmt->close();
        if (count($ids) === 1) {
            applyOperationToDocument($db, $docs, $operationId, $ids[0], $amount, $paidAt, 'inn_amount');
        }
    }
}

function applyOperationToDocument(mysqli $db, FinanceDocumentModel $docs, $operationId, $docId, $amount, $paidAt, $method)
{
    $operationId = (string)$operationId;
    $docId = (int)$docId;
    if ($operationId === '' || $docId <= 0) return;

    $db->begin_transaction();
    try {
        $docs->updateById($docId, [
            'is_paid' => 1,
            'paid_status' => 'paid',
            'paid_at' => (string)$paidAt,
            'paid_sum' => (float)$amount,
        ]);

        $stmt = $db->prepare("UPDATE invoice_plans SET status = 'paid', updated_at = NOW() WHERE document_id = ?");
        if ($stmt) {
            $stmt->bind_param('i', $docId);
            $stmt->execute();
            $stmt->close();
        }

        if (columnExists($db, 'finance_bank_operations', 'matched_document_id')) {
            $stmt = $db->prepare("UPDATE finance_bank_operations
                                  SET matched_document_id = ?, match_method = ?, matched_at = NOW()
                                  WHERE operation_id = ?");
            if ($stmt) {
                $m = (string)$method;
                $stmt->bind_param('iss', $docId, $m, $operationId);
                $stmt->execute();
                $stmt->close();
            }
        }

        $db->commit();
        echo "PAID_MATCH doc_id={$docId} operation_id={$operationId} method={$method}\n";
    } catch (Throwable $e) {
        $db->rollback();
    }
}

function bindStmtDynamic(mysqli_stmt $stmt, $types, array $values)
{
    $refs = [];
    $refs[] = &$types;
    foreach ($values as $k => $v) {
        $values[$k] = $v;
        $refs[] = &$values[$k];
    }
    call_user_func_array([$stmt, 'bind_param'], $refs);
}

function normalizeDateTimeValue($raw)
{
    $raw = trim((string)$raw);
    if ($raw === '') {
        return date('Y-m-d H:i:s');
    }
    if (preg_match('/^\d{10}$/', $raw)) {
        return date('Y-m-d H:i:s', (int)$raw);
    }
    if (preg_match('/^\d{13}$/', $raw)) {
        return date('Y-m-d H:i:s', (int)floor(((float)$raw) / 1000));
    }
    $ts = strtotime($raw);
    if ($ts !== false) {
        return date('Y-m-d H:i:s', $ts);
    }
    return date('Y-m-d H:i:s');
}

function resolveOperationId(array $op, $opTime, $amount, $currency, $accountNumber, $description, $counterpartyName, $counterpartyInn)
{
    $operationId = trim((string)($op['operationId'] ?? $op['operation_id'] ?? $op['id'] ?? ''));
    if ($operationId !== '') {
        return substr($operationId, 0, 64);
    }
    $parts = [
        'ext',
        (string)$opTime,
        number_format((float)$amount, 2, '.', ''),
        strtoupper((string)$currency),
        preg_replace('/\s+/u', ' ', trim((string)$accountNumber)),
        preg_replace('/\s+/u', ' ', trim((string)$description)),
        preg_replace('/\s+/u', ' ', trim((string)$counterpartyName)),
        preg_replace('/\s+/u', ' ', trim((string)$counterpartyInn)),
    ];
    return 'ext_' . sha1(implode('|', $parts));
}

function columnExists(mysqli $db, $table, $column)
{
    $table = $db->real_escape_string((string)$table);
    $column = $db->real_escape_string((string)$column);
    $res = $db->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
    $ok = $res && $res->num_rows > 0;
    if ($res) $res->close();
    return $ok;
}

function tableExists(mysqli $db, $table)
{
    $table = $db->real_escape_string($table);
    $res = $db->query("SHOW TABLES LIKE '{$table}'");
    $ok = $res && $res->num_rows > 0;
    if ($res) $res->close();
    return $ok;
}
