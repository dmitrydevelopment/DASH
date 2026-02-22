<?php

set_time_limit(300);

require_once __DIR__ . '/../config/config.php';
$db = require __DIR__ . '/../app/bootstrap.php';

require_once APP_BASE_PATH . '/app/models/PlannedInvoiceModel.php';
require_once APP_BASE_PATH . '/app/services/FinanceCalendarService.php';

$LOCK_FILE = sys_get_temp_dir() . '/finance_generate_planned_invoices.lock';
$lockFp = fopen($LOCK_FILE, 'c+');
if (!$lockFp || !flock($lockFp, LOCK_EX | LOCK_NB)) {
    echo "LOCKED\n";
    exit(0);
}

$today = date('Y-m-d');
$year = (int) date('Y');
$month = (int) date('n');
$firstDate = FinanceCalendarService::getFirstWorkdayOfMonth($month, $year);
$endDate = FinanceCalendarService::getAlternativeEndOfMonthDate($month, $year);

if ($today !== $firstDate && $today !== $endDate) {
    echo "DATE_DENIED\n";
    exit(0);
}

$planned = new PlannedInvoiceModel($db);

$res = $db->query("SELECT id, name, invoice_use_end_month_date
                  FROM clients
                  WHERE is_active = 1
                    AND client_type = 'support'
                    AND send_invoice_schedule = 1");
$clients = [];
while ($res && ($row = $res->fetch_assoc())) {
    $clients[] = $row;
}

foreach ($clients as $client) {
    $clientId = (int) $client['id'];
    $useEnd = (int) ($client['invoice_use_end_month_date'] ?? 0) === 1;

    $targetYear = $year;
    $targetMonth = $month;

    if ($useEnd && $today === $endDate) {
        $dt = new DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month));
        $next = $dt->modify('+1 month');
        $targetYear = (int) $next->format('Y');
        $targetMonth = (int) $next->format('n');
    }

    $exists = $planned->findByClientPeriod($clientId, $targetYear, $targetMonth);
    if ($exists) {
        continue;
    }

    $itemsRes = $db->query("SELECT service_name, service_price FROM client_invoice_items WHERE client_id = {$clientId} ORDER BY sort_order ASC, id ASC");
    $items = [];
    $categories = [];
    $sum = 0.0;
    while ($itemsRes && ($it = $itemsRes->fetch_assoc())) {
        $name = trim((string) ($it['service_name'] ?? ''));
        $amount = (float) ($it['service_price'] ?? 0);
        if ($name === '' || $amount <= 0) continue;
        $items[] = ['name' => $name, 'amount' => $amount];
        $sum += $amount;
    }

    $plannedDate = $useEnd
        ? FinanceCalendarService::getAlternativeEndOfMonthDate($targetMonth, $targetYear)
        : FinanceCalendarService::getFirstWorkdayOfMonth($targetMonth, $targetYear);

    $created = $planned->create([
        'client_id' => $clientId,
        'period_year' => $targetYear,
        'period_month' => $targetMonth,
        'planned_send_date' => $plannedDate,
        'status' => 'planned',
        'work_items_json' => json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'categories_json' => json_encode($categories, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'total_sum' => $sum,
        'sent_at' => null,
        'due_date' => null,
        'payment_status_cached' => 'unpaid',
        'payment_date_cached' => null,
        'days_overdue_cached' => 0,
        'is_overdue_cached' => 0,
        'linked_document_id' => 0,
        'created_by_user_id' => 0,
        'notes' => '',
    ]);

    if ($created) {
        echo "PLANNED_OK client_id={$clientId} period={$targetYear}-{$targetMonth}\n";
    }
}

echo "DONE\n";
