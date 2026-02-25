<?php

require_once APP_BASE_PATH . '/app/models/FinanceDocumentModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceSendEventModel.php';
require_once APP_BASE_PATH . '/app/models/InvoicePlanModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceProjectModel.php';

class FinanceController
{
    private $db;
    private $docs;
    private $events;
    private $plans;
    private $projects;
    private $financeDocColumns = null;
    private $settingsColumns = null;
    private $invoicePlanColumns = null;
    private $bankOperationColumns = null;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
        $this->docs = new FinanceDocumentModel($db);
        $this->events = new FinanceSendEventModel($db);
        $this->plans = new InvoicePlanModel($db);
        $this->projects = new FinanceProjectModel($db);
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

        $paymentDueDays = $this->getOverdueDaysSetting();
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
            $invoiceBaseDate = !empty($row['invoice_doc_date']) ? (string)$row['invoice_doc_date'] : (string)($row['sent_at'] ?? '');
            $row['days_since_sent'] = $invoiceBaseDate !== '' ? (int) floor((time() - strtotime($invoiceBaseDate)) / 86400) : 0;
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

    public function statusBoard()
    {
        Auth::requireAuth();
        $this->repairMissingInvoicePlansFromDocuments();

        $rows = $this->plans->all();
        $projects = $this->projects->all();
        $paymentDueDays = $this->getOverdueDaysSetting();

        $clientIds = [];
        foreach ($rows as $row) {
            $clientIds[] = (int)($row['client_id'] ?? 0);
        }
        $invoiceSums = $this->plans->getClientInvoiceSums($clientIds);

        $endMonth = [];
        $waitingRecent = [];
        $waitingOverdue = [];

        foreach ($rows as $row) {
            $row['items_snapshot'] = json_decode((string)($row['work_items_json'] ?? '[]'), true);
            if (!is_array($row['items_snapshot'])) {
                $row['items_snapshot'] = [];
            }

            $sum = 0.0;
            foreach ($row['items_snapshot'] as $line) {
                $sum += (float)($line['amount'] ?? 0);
            }
            $cid = (int)($row['client_id'] ?? 0);
            if (isset($invoiceSums[$cid]) && $invoiceSums[$cid] > 0) {
                $sum = (float)$invoiceSums[$cid];
            }

            $row['total_sum'] = $sum;
            $row['period_label'] = sprintf('%02d.%04d', (int)$row['period_month'], (int)$row['period_year']);
            $row['created_date'] = !empty($row['created_at']) ? date('d.m.Y', strtotime($row['created_at'])) : '—';
            $row['sent_date'] = !empty($row['sent_at']) ? date('d.m.Y', strtotime($row['sent_at'])) : '—';
            $row['payment_due_days'] = $paymentDueDays;
            $invoiceBaseDate = !empty($row['invoice_doc_date']) ? (string)$row['invoice_doc_date'] : (string)($row['sent_at'] ?? '');
            $row['days_since_sent'] = $invoiceBaseDate !== '' ? (int) floor((time() - strtotime($invoiceBaseDate)) / 86400) : 0;

            if (($row['status'] ?? '') === 'planned'
                && (int)($row['send_invoice_schedule'] ?? 0) === 1
                && (int)($row['invoice_use_end_month_date'] ?? 0) === 1
            ) {
                $endMonth[] = $row;
                continue;
            }

            if (($row['status'] ?? '') === 'sent_waiting_payment') {
                if ((int)$row['days_since_sent'] > $paymentDueDays) {
                    $waitingOverdue[] = $row;
                } else {
                    $waitingRecent[] = $row;
                }
            }
        }

        $sortBySentAtDesc = function (array $a, array $b) {
            $aTs = !empty($a['sent_at']) ? strtotime((string)$a['sent_at']) : 0;
            $bTs = !empty($b['sent_at']) ? strtotime((string)$b['sent_at']) : 0;
            if ($aTs === $bTs) {
                $aCreated = !empty($a['created_at']) ? strtotime((string)$a['created_at']) : 0;
                $bCreated = !empty($b['created_at']) ? strtotime((string)$b['created_at']) : 0;
                if ($aCreated === $bCreated) {
                    return (int)($b['id'] ?? 0) <=> (int)($a['id'] ?? 0);
                }
                return $bCreated <=> $aCreated;
            }
            return $bTs <=> $aTs;
        };
        usort($waitingRecent, $sortBySentAtDesc);
        usort($waitingOverdue, $sortBySentAtDesc);

        $projectsOut = [];
        foreach ($projects as $project) {
            $workItems = json_decode((string)($project['work_items_json'] ?? '[]'), true);
            if (!is_array($workItems)) {
                $workItems = [];
            }
            $statusCode = (string)($project['status'] ?? 'in_progress');
            if ($statusCode === 'in_work') $statusCode = 'in_progress';
            if ($statusCode === 'ready_to_invoice') $statusCode = 'to_pay';
            $projectsOut[] = [
                'id' => (int)$project['id'],
                'client_id' => (int)$project['client_id'],
                'client_name' => (string)($project['client_name'] ?? ''),
                'email' => (string)($project['email'] ?? ''),
                'send_invoice_telegram' => (int)($project['send_invoice_telegram'] ?? 0),
                'send_invoice_diadoc' => (int)($project['send_invoice_diadoc'] ?? 0),
                'name' => (string)($project['name'] ?? ''),
                'amount' => (float)($project['amount'] ?? 0),
                'work_items_json' => $project['work_items_json'] ?? '[]',
                'work_items' => $workItems,
                'status' => $statusCode,
                'status_name' => (string)($project['status_name'] ?? $project['status'] ?? ''),
                'created_at' => $project['created_at'] ?? null,
                'updated_at' => $project['updated_at'] ?? null
            ];
        }

        $nearest = 0.0;
        $confirmed = 0.0;
        $mrr = 0.0;
        foreach ($waitingRecent as $row) {
            $nearest += (float)($row['total_sum'] ?? 0);
        }
        foreach ($waitingOverdue as $row) {
            $nearest += (float)($row['total_sum'] ?? 0);
        }
        foreach ($endMonth as $row) {
            $confirmed += (float)($row['total_sum'] ?? 0);
            $mrr += (float)($row['total_sum'] ?? 0);
        }
        foreach ($waitingRecent as $row) {
            $confirmed += (float)($row['total_sum'] ?? 0);
            $mrr += (float)($row['total_sum'] ?? 0);
        }
        foreach ($waitingOverdue as $row) {
            $confirmed += (float)($row['total_sum'] ?? 0);
            $mrr += (float)($row['total_sum'] ?? 0);
        }
        foreach ($projectsOut as $project) {
            $confirmed += (float)($project['amount'] ?? 0);
        }

        sendJson([
            'data' => [
                'projects_in_work' => $projectsOut,
                'end_month' => $endMonth,
                'waiting_recent' => $waitingRecent,
                'waiting_overdue' => $waitingOverdue,
                'meta' => [
                    'payment_due_days' => $paymentDueDays
                ],
                'metrics' => [
                    'nearest_payments' => $nearest,
                    'confirmed_total' => $confirmed,
                    'mrr' => $mrr
                ]
            ]
        ]);
    }

    public function overview()
    {
        Auth::requireAuth();

        $monthIncome = 0.0;
        $resIncome = $this->db->query("SELECT SUM(service_price) AS total_income FROM client_invoice_items");
        if ($resIncome) {
            $row = $resIncome->fetch_assoc();
            $monthIncome = (float)($row['total_income'] ?? 0);
            $resIncome->close();
        }

        $salaryExpense = 0.0;
        $resSalary = $this->db->query("SELECT SUM(salary_monthly) AS salary_total FROM employees");
        if ($resSalary) {
            $row = $resSalary->fetch_assoc();
            $salaryExpense = (float)($row['salary_total'] ?? 0);
            $resSalary->close();
        }

        $fixedExpense = 0.0;
        if ($this->hasSettingsColumn('finance_total_expense')) {
            $resSettings = $this->db->query("SELECT finance_total_expense FROM crm_settings WHERE id = 1 LIMIT 1");
            if ($resSettings) {
                $row = $resSettings->fetch_assoc();
                $fixedExpense = (float)($row['finance_total_expense'] ?? 0);
                $resSettings->close();
            }
        }

        $categories = [];
        $resPlans = $this->db->query("SELECT work_items_json FROM invoice_plans ORDER BY id DESC LIMIT 1000");
        if ($resPlans) {
            while ($row = $resPlans->fetch_assoc()) {
                $items = json_decode((string)($row['work_items_json'] ?? '[]'), true);
                if (!is_array($items)) continue;
                foreach ($items as $line) {
                    $name = trim((string)($line['category'] ?? ''));
                    if ($name === '') {
                        $name = 'Без категории';
                    }
                    $amount = (float)($line['amount'] ?? 0);
                    if (!isset($categories[$name])) {
                        $categories[$name] = 0.0;
                    }
                    $categories[$name] += $amount;
                }
            }
            $resPlans->close();
        }

        if (empty($categories)) {
            $categories['Без категории'] = $monthIncome;
        }

        $categoriesOut = [];
        foreach ($categories as $name => $amount) {
            $categoriesOut[] = [
                'name' => (string)$name,
                'amount' => (float)$amount,
            ];
        }
        usort($categoriesOut, function ($a, $b) {
            return (float)$b['amount'] <=> (float)$a['amount'];
        });

        $totalExpense = $fixedExpense + $salaryExpense;
        $profit = $monthIncome - $totalExpense;
        $margin = $monthIncome > 0 ? round(($profit / $monthIncome) * 100, 1) : 0.0;

        $trendRows = [];
        try {
            $trendRows = $this->buildRevenueTrendRows(12);
        } catch (Throwable $e) {
            $trendRows = [];
        }
        $mom = 0.0;
        $yoy = 0.0;
        if (!empty($trendRows)) {
            $last = $trendRows[count($trendRows) - 1];
            $prev = count($trendRows) >= 2 ? $trendRows[count($trendRows) - 2] : null;
            $mom = $prev ? $this->calcPercentChange((float)$last['revenue'], (float)$prev['revenue']) : 0.0;
            $yoy = $this->calcPercentChange((float)$last['revenue'], (float)$last['previous_year']);
        }

        sendJson([
            'data' => [
                'income_total' => $monthIncome,
                'income_categories' => $categoriesOut,
                'expense_total' => $totalExpense,
                'expense_fixed' => $fixedExpense,
                'expense_salaries' => $salaryExpense,
                'profit_total' => $profit,
                'profit_margin_percent' => $margin,
                'revenue_trends' => $trendRows,
                'revenue_mom_percent' => $mom,
                'revenue_yoy_percent' => $yoy,
            ],
        ]);
    }

    public function paymentsHistory()
    {
        Auth::requireAuth();

        $dateFrom = isset($_GET['date_from']) ? trim((string)$_GET['date_from']) : '';
        $dateTo = isset($_GET['date_to']) ? trim((string)$_GET['date_to']) : '';
        $clientSearch = isset($_GET['client']) ? trim((string)$_GET['client']) : '';

        if ($dateFrom !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $dateFrom = '';
        }
        if ($dateTo !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $dateTo = '';
        }

        $hasIsPaid = $this->hasFinanceDocColumn('is_paid');
        $hasPaidStatus = $this->hasFinanceDocColumn('paid_status');
        $paidDateExpr = $this->hasFinanceDocColumn('paid_at')
            ? "COALESCE(d.paid_at, d.updated_at, CONCAT(d.doc_date, ' 00:00:00'))"
            : "COALESCE(d.updated_at, CONCAT(d.doc_date, ' 00:00:00'))";

        $where = ["d.doc_type = 'invoice'"];
        if ($hasIsPaid && $hasPaidStatus) {
            $where[] = "(COALESCE(d.is_paid, 0) = 1 OR d.paid_status = 'paid')";
        } elseif ($hasIsPaid) {
            $where[] = "COALESCE(d.is_paid, 0) = 1";
        } elseif ($hasPaidStatus) {
            $where[] = "d.paid_status = 'paid'";
        } else {
            $where[] = "1 = 0";
        }

        $types = '';
        $params = [];
        if ($dateFrom !== '') {
            $where[] = "DATE($paidDateExpr) >= ?";
            $types .= 's';
            $params[] = $dateFrom;
        }
        if ($dateTo !== '') {
            $where[] = "DATE($paidDateExpr) <= ?";
            $types .= 's';
            $params[] = $dateTo;
        }
        if ($clientSearch !== '') {
            $where[] = "c.name LIKE ?";
            $types .= 's';
            $params[] = '%' . $clientSearch . '%';
        }

        $sql = "SELECT d.id, d.client_id, c.name AS client_name, d.total_sum, d.paid_sum, d.doc_number, d.download_token,
                       $paidDateExpr AS paid_date
                FROM finance_documents d
                INNER JOIN clients c ON c.id = d.client_id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY paid_date DESC, d.id DESC
                LIMIT 1000";

        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            sendError('DB_ERROR', 'Не удалось получить историю оплат', 500);
        }
        $this->bindStmtParams($stmt, $types, $params);
        $stmt->execute();
        $res = $stmt->get_result();
        $rows = [];
        $total = 0.0;
        while ($res && ($row = $res->fetch_assoc())) {
            $amount = (float)($row['paid_sum'] ?? 0);
            if ($amount <= 0) {
                $amount = (float)($row['total_sum'] ?? 0);
            }
            $rows[] = [
                'id' => (int)($row['id'] ?? 0),
                'client_id' => (int)($row['client_id'] ?? 0),
                'client_name' => (string)($row['client_name'] ?? '—'),
                'amount' => $amount,
                'paid_date' => (string)($row['paid_date'] ?? ''),
                'doc_number' => (string)($row['doc_number'] ?? ''),
                'invoice_download_url' => !empty($row['download_token'])
                    ? '/api.php/finance/download?token=' . rawurlencode((string)$row['download_token'])
                    : null,
            ];
            $total += $amount;
        }
        $stmt->close();

        $count = count($rows);
        $avg = $count > 0 ? ($total / $count) : 0.0;

        sendJson([
            'data' => [
                'items' => $rows,
                'summary' => [
                    'count' => $count,
                    'total' => $total,
                    'average' => $avg,
                ],
            ],
        ]);
    }

    public function paymentsUnknown()
    {
        Auth::requireAuth();

        $dateFrom = isset($_GET['date_from']) ? trim((string)$_GET['date_from']) : '';
        $dateTo = isset($_GET['date_to']) ? trim((string)$_GET['date_to']) : '';
        $query = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
        $inn = isset($_GET['inn']) ? trim((string)$_GET['inn']) : '';
        if ($dateFrom !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) $dateFrom = '';
        if ($dateTo !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) $dateTo = '';

        $timeCol = $this->hasBankOperationColumn('operation_time') ? 'operation_time' : ($this->hasBankOperationColumn('occurred_at') ? 'occurred_at' : 'created_at');
        $descCol = $this->hasBankOperationColumn('description') ? 'description' : ($this->hasBankOperationColumn('purpose') ? 'purpose' : "''");
        $nameCol = $this->hasBankOperationColumn('counterparty_name') ? 'counterparty_name' : "''";
        $innCol = $this->hasBankOperationColumn('counterparty_inn') ? 'counterparty_inn' : "''";

        $where = ["(bo.matched_document_id IS NULL OR bo.matched_document_id = 0)"];
        $types = '';
        $params = [];
        if ($dateFrom !== '') {
            $where[] = "DATE(bo.$timeCol) >= ?";
            $types .= 's';
            $params[] = $dateFrom;
        }
        if ($dateTo !== '') {
            $where[] = "DATE(bo.$timeCol) <= ?";
            $types .= 's';
            $params[] = $dateTo;
        }
        if ($query !== '') {
            $where[] = "(bo.$descCol LIKE ? OR bo.$nameCol LIKE ? OR bo.$innCol LIKE ? OR bo.operation_id LIKE ?)";
            $types .= 'ssss';
            $like = '%' . $query . '%';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }
        if ($inn !== '') {
            $where[] = "bo.$innCol LIKE ?";
            $types .= 's';
            $params[] = '%' . $inn . '%';
        }

        $sql = "SELECT bo.id, bo.operation_id, bo.amount, bo.currency, bo.$timeCol AS operation_time,
                       bo.$descCol AS description, bo.$nameCol AS counterparty_name, bo.$innCol AS counterparty_inn
                FROM finance_bank_operations bo
                WHERE " . implode(' AND ', $where) . "
                ORDER BY bo.$timeCol DESC, bo.id DESC
                LIMIT 1000";
        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            sendError('DB_ERROR', 'Не удалось получить неизвестные поступления', 500);
        }
        $this->bindStmtParams($stmt, $types, $params);
        $stmt->execute();
        $res = $stmt->get_result();

        $rows = [];
        $total = 0.0;
        while ($res && ($row = $res->fetch_assoc())) {
            $amount = (float)($row['amount'] ?? 0);
            $rows[] = [
                'id' => (int)($row['id'] ?? 0),
                'operation_id' => (string)($row['operation_id'] ?? ''),
                'operation_time' => (string)($row['operation_time'] ?? ''),
                'amount' => $amount,
                'currency' => (string)($row['currency'] ?? 'RUB'),
                'description' => (string)($row['description'] ?? ''),
                'counterparty_name' => (string)($row['counterparty_name'] ?? ''),
                'counterparty_inn' => (string)($row['counterparty_inn'] ?? ''),
            ];
            $total += $amount;
        }
        $stmt->close();

        sendJson([
            'data' => [
                'items' => $rows,
                'summary' => [
                    'count' => count($rows),
                    'total' => $total,
                ],
            ],
        ]);
    }

    public function paymentsCandidateInvoices()
    {
        Auth::requireAuth();

        $client = isset($_GET['client']) ? trim((string)$_GET['client']) : '';
        $docNumber = isset($_GET['doc_number']) ? trim((string)$_GET['doc_number']) : '';
        $dateFrom = isset($_GET['date_from']) ? trim((string)$_GET['date_from']) : '';
        $dateTo = isset($_GET['date_to']) ? trim((string)$_GET['date_to']) : '';
        $amountRaw = isset($_GET['amount']) ? trim((string)$_GET['amount']) : '';
        $invoiceType = isset($_GET['invoice_type']) ? trim((string)$_GET['invoice_type']) : '';
        if ($dateFrom !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) $dateFrom = '';
        if ($dateTo !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) $dateTo = '';

        $where = ["d.doc_type = 'invoice'"];
        $where[] = $this->buildInvoiceUnpaidWhere('d');

        $types = '';
        $params = [];
        if ($client !== '') {
            $where[] = "c.name LIKE ?";
            $types .= 's';
            $params[] = '%' . $client . '%';
        }
        if ($docNumber !== '') {
            $where[] = "d.doc_number LIKE ?";
            $types .= 's';
            $params[] = '%' . $docNumber . '%';
        }
        if ($dateFrom !== '') {
            $where[] = "d.doc_date >= ?";
            $types .= 's';
            $params[] = $dateFrom;
        }
        if ($dateTo !== '') {
            $where[] = "d.doc_date <= ?";
            $types .= 's';
            $params[] = $dateTo;
        }
        if ($amountRaw !== '' && is_numeric(str_replace(',', '.', $amountRaw))) {
            $where[] = "ABS(d.total_sum - ?) < 0.01";
            $types .= 'd';
            $params[] = (float)str_replace(',', '.', $amountRaw);
        }
        $hasSourceType = $this->hasInvoicePlanColumn('source_type');
        if ($hasSourceType) {
            if ($invoiceType === 'project') {
                $where[] = "EXISTS (SELECT 1 FROM invoice_plans ip WHERE ip.document_id = d.id AND ip.source_type = 'project')";
            } elseif ($invoiceType === 'support') {
                $where[] = "NOT EXISTS (SELECT 1 FROM invoice_plans ip WHERE ip.document_id = d.id AND ip.source_type = 'project')";
            }
        } else {
            if ($invoiceType === 'support') {
                $where[] = "d.doc_number NOT LIKE 'INV-PLAN-%'";
            } elseif ($invoiceType === 'project') {
                $where[] = "d.doc_number LIKE 'INV-PLAN-%'";
            }
        }

        $invoiceTypeExpr = $hasSourceType
            ? "CASE WHEN EXISTS (SELECT 1 FROM invoice_plans ip WHERE ip.document_id = d.id AND ip.source_type = 'project')
                    THEN 'project'
                    ELSE 'support'
               END"
            : "CASE WHEN d.doc_number LIKE 'INV-PLAN-%' THEN 'project' ELSE 'support' END";

        $overdueDays = (int)$this->getOverdueDaysSetting();
        $invoiceDateExpr = "COALESCE(d.doc_date, DATE(d.created_at))";
        $sentDateExpr = "COALESCE(DATE(ip.sent_at), $invoiceDateExpr)";
        $daysSinceSentExpr = "GREATEST(DATEDIFF(CURDATE(), $sentDateExpr), 0)";
        $isOverdueExpr = "($daysSinceSentExpr > $overdueDays)";
        $periodLabelExpr = "COALESCE(ip.period_label, CONCAT(LPAD(d.period_month, 2, '0'), '.', d.period_year))";

        $sql = "SELECT d.id, d.client_id, c.name AS client_name, d.doc_number, d.doc_date, d.total_sum, d.download_token,
                       ip.id AS plan_id, $periodLabelExpr AS period_label, $sentDateExpr AS sent_date,
                       $daysSinceSentExpr AS days_since_sent, $overdueDays AS payment_due_days,
                       CASE WHEN $isOverdueExpr THEN 1 ELSE 0 END AS is_overdue,
                       $invoiceTypeExpr AS invoice_type
                FROM finance_documents d
                INNER JOIN clients c ON c.id = d.client_id
                LEFT JOIN invoice_plans ip ON ip.document_id = d.id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY d.doc_date DESC, d.id DESC
                LIMIT 300";
        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            sendError('DB_ERROR', 'Не удалось получить счета для сопоставления', 500);
        }
        $this->bindStmtParams($stmt, $types, $params);
        $stmt->execute();
        $res = $stmt->get_result();

        $rows = [];
        while ($res && ($row = $res->fetch_assoc())) {
            $rows[] = [
                'id' => (int)($row['id'] ?? 0),
                'client_id' => (int)($row['client_id'] ?? 0),
                'client_name' => (string)($row['client_name'] ?? ''),
                'doc_number' => (string)($row['doc_number'] ?? ''),
                'doc_date' => (string)($row['doc_date'] ?? ''),
                'plan_id' => (int)($row['plan_id'] ?? 0),
                'period_label' => (string)($row['period_label'] ?? ''),
                'sent_date' => (string)($row['sent_date'] ?? ''),
                'days_since_sent' => max(0, (int)($row['days_since_sent'] ?? 0)),
                'payment_due_days' => max(0, (int)($row['payment_due_days'] ?? $overdueDays)),
                'is_overdue' => (int)($row['is_overdue'] ?? 0) === 1,
                'amount' => (float)($row['total_sum'] ?? 0),
                'invoice_type' => (string)($row['invoice_type'] ?? 'support'),
                'invoice_download_url' => !empty($row['download_token'])
                    ? '/api.php/finance/download?token=' . rawurlencode((string)$row['download_token'])
                    : null,
            ];
        }
        $stmt->close();

        sendJson(['data' => ['items' => $rows]]);
    }

    public function paymentsMatch()
    {
        Auth::requireAuth();
        $payload = getJsonPayload();
        $operationId = isset($payload['operation_id']) ? trim((string)$payload['operation_id']) : '';
        $documentId = isset($payload['document_id']) ? (int)$payload['document_id'] : 0;
        if ($operationId === '' || $documentId <= 0) {
            sendError('VALIDATION_ERROR', 'operation_id и document_id обязательны', 422);
        }

        $timeCol = $this->hasBankOperationColumn('operation_time') ? 'operation_time' : ($this->hasBankOperationColumn('occurred_at') ? 'occurred_at' : 'created_at');

        $stmt = $this->db->prepare("SELECT operation_id, amount, $timeCol AS op_time, matched_document_id FROM finance_bank_operations WHERE operation_id = ? LIMIT 1");
        if (!$stmt) {
            sendError('DB_ERROR', 'Не удалось получить операцию', 500);
        }
        $stmt->bind_param('s', $operationId);
        $stmt->execute();
        $res = $stmt->get_result();
        $op = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        if (!$op) {
            sendError('NOT_FOUND', 'Операция не найдена', 404);
        }
        if ((int)($op['matched_document_id'] ?? 0) > 0) {
            sendError('ALREADY_MATCHED', 'Операция уже привязана', 409);
        }

        $stmt = $this->db->prepare("SELECT id, total_sum FROM finance_documents WHERE id = ? AND doc_type = 'invoice' LIMIT 1");
        if (!$stmt) {
            sendError('DB_ERROR', 'Не удалось получить счет', 500);
        }
        $stmt->bind_param('i', $documentId);
        $stmt->execute();
        $res = $stmt->get_result();
        $doc = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        if (!$doc) {
            sendError('NOT_FOUND', 'Счет не найден', 404);
        }

        $paidAt = !empty($op['op_time']) ? (string)$op['op_time'] : date('Y-m-d H:i:s');
        $paidSum = (float)($op['amount'] ?? 0);

        $this->db->begin_transaction();
        try {
            $updatePayload = ['is_paid' => 1, 'paid_at' => $paidAt, 'paid_sum' => $paidSum, 'paid_status' => 'paid'];
            $this->docs->updateById((int)$documentId, $updatePayload);

            if ($this->hasInvoicePlanColumn('document_id') && $this->hasInvoicePlanColumn('status')) {
                $stmt = $this->db->prepare("UPDATE invoice_plans SET status = 'paid', updated_at = NOW() WHERE document_id = ?");
                if ($stmt) {
                    $stmt->bind_param('i', $documentId);
                    $stmt->execute();
                    $stmt->close();
                }
            }

            $matchMethod = 'manual';
            $stmt = $this->db->prepare("UPDATE finance_bank_operations
                                        SET matched_document_id = ?, match_method = ?, matched_at = NOW()
                                        WHERE operation_id = ?");
            if (!$stmt) {
                throw new RuntimeException('Не удалось сохранить сопоставление');
            }
            $stmt->bind_param('iss', $documentId, $matchMethod, $operationId);
            $stmt->execute();
            $stmt->close();

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollback();
            sendError('MATCH_FAILED', 'Не удалось привязать оплату к счету', 500);
        }

        sendJson(['ok' => true, 'operation_id' => $operationId, 'document_id' => $documentId]);
    }

    public function tbankWebhook()
    {
        $raw = file_get_contents('php://input');
        $payload = json_decode((string)$raw, true);
        if (!is_array($payload)) {
            sendError('BAD_PAYLOAD', 'Некорректный JSON webhook', 400);
        }

        $ops = [];
        if (isset($payload['operations']) && is_array($payload['operations'])) {
            $ops = $payload['operations'];
        } elseif (isset($payload['data']['operations']) && is_array($payload['data']['operations'])) {
            $ops = $payload['data']['operations'];
        } elseif (isset($payload[0]) && is_array($payload[0])) {
            $ops = $payload;
        } else {
            $ops = [$payload];
        }

        $saved = 0;
        $matched = 0;
        foreach ($ops as $op) {
            if (!is_array($op)) continue;
            $operationId = $this->upsertBankOperation($op);
            if ($operationId === '') continue;
            $saved++;
            if ($this->autoMatchBankOperation($operationId)) {
                $matched++;
            }
        }

        sendJson([
            'ok' => true,
            'saved' => $saved,
            'matched' => $matched,
        ]);
    }

    public function receivables()
    {
        Auth::requireAuth();

        $dateFrom = isset($_GET['date_from']) ? trim((string)$_GET['date_from']) : '';
        $dateTo = isset($_GET['date_to']) ? trim((string)$_GET['date_to']) : '';
        $clientSearch = isset($_GET['client']) ? trim((string)$_GET['client']) : '';
        if ($dateFrom !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $dateFrom = '';
        }
        if ($dateTo !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $dateTo = '';
        }

        $hasIsPaid = $this->hasFinanceDocColumn('is_paid');
        $hasPaidStatus = $this->hasFinanceDocColumn('paid_status');
        $overdueDays = $this->getOverdueDaysSetting();
        $invoiceDateExpr = "COALESCE(d.doc_date, DATE(d.created_at))";
        $daysSinceInvoiceExpr = "GREATEST(DATEDIFF(CURDATE(), $invoiceDateExpr), 0)";
        $dueDateExpr = "DATE_ADD($invoiceDateExpr, INTERVAL " . (int)$overdueDays . " DAY)";
        $daysPastDueExpr = "GREATEST(($daysSinceInvoiceExpr - " . (int)$overdueDays . "), 0)";
        $daysToDueExpr = "DATEDIFF($dueDateExpr, CURDATE())";
        $daysInStatusExpr = "DATEDIFF(CURDATE(), $invoiceDateExpr)";

        $where = ["d.doc_type = 'invoice'"];
        if ($hasIsPaid && $hasPaidStatus) {
            $where[] = "NOT (COALESCE(d.is_paid, 0) = 1 OR d.paid_status = 'paid')";
        } elseif ($hasIsPaid) {
            $where[] = "COALESCE(d.is_paid, 0) = 0";
        } elseif ($hasPaidStatus) {
            $where[] = "(d.paid_status IS NULL OR d.paid_status <> 'paid')";
        }

        $types = '';
        $params = [];
        if ($dateFrom !== '') {
            $where[] = "DATE($invoiceDateExpr) >= ?";
            $types .= 's';
            $params[] = $dateFrom;
        }
        if ($dateTo !== '') {
            $where[] = "DATE($invoiceDateExpr) <= ?";
            $types .= 's';
            $params[] = $dateTo;
        }
        if ($clientSearch !== '') {
            $where[] = "c.name LIKE ?";
            $types .= 's';
            $params[] = '%' . $clientSearch . '%';
        }
        $where[] = "($daysSinceInvoiceExpr > " . (int)$overdueDays . ")";

        $sql = "SELECT d.id, d.client_id, c.name AS client_name, d.total_sum, d.doc_number, d.download_token,
                       $invoiceDateExpr AS invoice_date, $dueDateExpr AS due_date,
                       $daysPastDueExpr AS days_overdue, $daysToDueExpr AS days_to_due, $daysInStatusExpr AS days_in_status
                FROM finance_documents d
                INNER JOIN clients c ON c.id = d.client_id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY invoice_date DESC, d.id DESC
                LIMIT 2000";

        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            sendError('DB_ERROR', 'Не удалось получить задолженности', 500);
        }
        $this->bindStmtParams($stmt, $types, $params);
        $stmt->execute();
        $res = $stmt->get_result();

        $timeline = [];
        $total = 0.0;
        $invoicesCount = 0;
        $overdue90Plus = 0.0;
        $overdueDaysTotal = 0;
        $overdueCount = 0;
        $buckets = [
            '0_30_days' => ['amount' => 0.0, 'count' => 0],
            '31_60_days' => ['amount' => 0.0, 'count' => 0],
            '61_90_days' => ['amount' => 0.0, 'count' => 0],
            '90_plus_days' => ['amount' => 0.0, 'count' => 0],
        ];
        $debtorsMap = [];

        while ($res && ($row = $res->fetch_assoc())) {
            $amount = (float)($row['total_sum'] ?? 0);
            $daysOverdue = max(0, (int)($row['days_overdue'] ?? 0));
            $daysToDue = (int)($row['days_to_due'] ?? 0);
            $daysInStatus = max(0, (int)($row['days_in_status'] ?? 0));
            $isOverdue = $daysOverdue > 0;

            $timeline[] = [
                'id' => (int)($row['id'] ?? 0),
                'client_id' => (int)($row['client_id'] ?? 0),
                'client' => (string)($row['client_name'] ?? '—'),
                'amount' => $amount,
                'status' => $isOverdue ? 'Просрочен' : 'Не оплачен',
                'days_in_status' => $daysInStatus,
                'days_to_due' => $daysToDue,
                'days_overdue' => $daysOverdue,
                'invoice_date' => (string)($row['invoice_date'] ?? ''),
                'due_date' => (string)($row['due_date'] ?? ''),
                'overdue' => $isOverdue,
                'doc_number' => (string)($row['doc_number'] ?? ''),
                'invoice_download_url' => !empty($row['download_token'])
                    ? '/api.php/finance/download?token=' . rawurlencode((string)$row['download_token'])
                    : null,
            ];

            $total += $amount;
            $invoicesCount++;
            if ($daysOverdue > 0) {
                $overdueDaysTotal += $daysOverdue;
                $overdueCount++;
            }
            if ($daysOverdue > 90) {
                $overdue90Plus += $amount;
            }

            if ($daysOverdue <= 30) {
                $buckets['0_30_days']['amount'] += $amount;
                $buckets['0_30_days']['count']++;
            } elseif ($daysOverdue <= 60) {
                $buckets['31_60_days']['amount'] += $amount;
                $buckets['31_60_days']['count']++;
            } elseif ($daysOverdue <= 90) {
                $buckets['61_90_days']['amount'] += $amount;
                $buckets['61_90_days']['count']++;
            } else {
                $buckets['90_plus_days']['amount'] += $amount;
                $buckets['90_plus_days']['count']++;
            }

            $cid = (int)($row['client_id'] ?? 0);
            if (!isset($debtorsMap[$cid])) {
                $debtorsMap[$cid] = [
                    'client_id' => $cid,
                    'client' => (string)($row['client_name'] ?? '—'),
                    'amount' => 0.0,
                    'days_overdue' => 0,
                    'invoices_count' => 0,
                ];
            }
            $debtorsMap[$cid]['amount'] += $amount;
            $debtorsMap[$cid]['days_overdue'] = max($debtorsMap[$cid]['days_overdue'], $daysOverdue);
            $debtorsMap[$cid]['invoices_count']++;
        }
        $stmt->close();

        $topDebtors = array_values($debtorsMap);
        foreach ($topDebtors as &$debtor) {
            $d = (int)$debtor['days_overdue'];
            if ($d > 90 || (float)$debtor['amount'] >= 150000) {
                $debtor['priority'] = 'Критический';
            } elseif ($d > 60 || (float)$debtor['amount'] >= 80000) {
                $debtor['priority'] = 'Высокий';
            } elseif ($d > 0) {
                $debtor['priority'] = 'Средний';
            } else {
                $debtor['priority'] = 'Низкий';
            }
            $debtor['status'] = $d > 0 ? 'Просрочен' : 'Не оплачен';
        }
        unset($debtor);

        usort($topDebtors, function ($a, $b) {
            $cmpAmount = (float)$b['amount'] <=> (float)$a['amount'];
            if ($cmpAmount !== 0) return $cmpAmount;
            return (int)$b['days_overdue'] <=> (int)$a['days_overdue'];
        });
        if (count($topDebtors) > 20) {
            $topDebtors = array_slice($topDebtors, 0, 20);
        }

        $timelineSorted = $timeline;
        usort($timelineSorted, function ($a, $b) {
            $aTs = !empty($a['invoice_date']) ? strtotime((string)$a['invoice_date']) : 0;
            $bTs = !empty($b['invoice_date']) ? strtotime((string)$b['invoice_date']) : 0;
            if ($aTs === $bTs) {
                return (int)$b['id'] <=> (int)$a['id'];
            }
            return $bTs <=> $aTs;
        });

        $avgCollection = $overdueCount > 0 ? (int)round($overdueDaysTotal / $overdueCount) : 0;
        $efficiency = $invoicesCount > 0
            ? (float)round((($invoicesCount - $overdueCount) / $invoicesCount) * 100, 1)
            : 0.0;

        sendJson([
            'data' => [
                'summary_metrics' => [
                    'total_receivables' => $total,
                    'total_invoices' => $invoicesCount,
                    'overdue_90_plus' => $overdue90Plus,
                    'average_collection_time' => $avgCollection,
                    'collection_efficiency' => $efficiency,
                ],
                'aging_buckets' => $buckets,
                'top_debtors' => $topDebtors,
                'invoice_timeline' => $timelineSorted,
                'meta' => [
                    'overdue_days' => $overdueDays,
                ],
            ],
        ]);
    }

    public function actsIndex()
    {
        Auth::requireAuth();

        $dateFrom = isset($_GET['date_from']) ? trim((string)$_GET['date_from']) : '';
        $dateTo = isset($_GET['date_to']) ? trim((string)$_GET['date_to']) : '';
        $clientSearch = isset($_GET['client']) ? trim((string)$_GET['client']) : '';
        if ($dateFrom !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $dateFrom = '';
        }
        if ($dateTo !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $dateTo = '';
        }

        $where = ["d.doc_type = 'act'"];
        $types = '';
        $params = [];
        if ($dateFrom !== '') {
            $where[] = "d.doc_date >= ?";
            $types .= 's';
            $params[] = $dateFrom;
        }
        if ($dateTo !== '') {
            $where[] = "d.doc_date <= ?";
            $types .= 's';
            $params[] = $dateTo;
        }
        if ($clientSearch !== '') {
            $where[] = "c.name LIKE ?";
            $types .= 's';
            $params[] = '%' . $clientSearch . '%';
        }

        $sql = "SELECT d.id, d.client_id, c.name AS client_name, d.period_year, d.period_month, d.doc_date,
                       d.download_token, d.doc_number,
                       EXISTS (
                           SELECT 1 FROM finance_send_events ev
                           WHERE ev.document_id = d.id AND ev.status = 'success'
                       ) AS has_success_send
                FROM finance_documents d
                INNER JOIN clients c ON c.id = d.client_id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY d.doc_date DESC, d.id DESC
                LIMIT 1000";

        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            sendError('DB_ERROR', 'Не удалось получить акты', 500);
        }
        $this->bindStmtParams($stmt, $types, $params);
        $stmt->execute();
        $res = $stmt->get_result();
        $rows = [];
        while ($res && ($row = $res->fetch_assoc())) {
            $rows[] = [
                'id' => (int)($row['id'] ?? 0),
                'client_id' => (int)($row['client_id'] ?? 0),
                'client_name' => (string)($row['client_name'] ?? '—'),
                'period_label' => sprintf('%02d.%04d', (int)($row['period_month'] ?? 0), (int)($row['period_year'] ?? 0)),
                'doc_date' => (string)($row['doc_date'] ?? ''),
                'doc_number' => (string)($row['doc_number'] ?? ''),
                'status' => ((int)($row['has_success_send'] ?? 0) === 1) ? 'Отправлен' : 'Создан',
                'act_download_url' => !empty($row['download_token'])
                    ? '/api.php/finance/download?token=' . rawurlencode((string)$row['download_token'])
                    : null,
            ];
        }
        $stmt->close();

        sendJson(['data' => ['items' => $rows]]);
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

        $sourceType = (isset($payload['invoice_type']) && (string)$payload['invoice_type'] === 'project') ? 'project' : 'support';
        $planId = $this->plans->create($clientId, $periodYear, $periodMonth, $periodLabel, $itemsJson, $channelsJson, $sendDate, $sourceType);
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
        $ok = $this->plans->deleteWithLinkedDocument((int)$id);
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

    public function invoicePlansSendEndMonthNow()
    {
        Auth::requireAuth();

        $rows = $this->plans->all();
        $sent = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $plan) {
            if (($plan['status'] ?? '') !== 'planned'
                || (int)($plan['send_invoice_schedule'] ?? 0) !== 1
                || (int)($plan['invoice_use_end_month_date'] ?? 0) !== 1
            ) {
                continue;
            }

            $id = (int)($plan['id'] ?? 0);
            if ($id <= 0) {
                $skipped++;
                continue;
            }

            $payload = $this->buildPlanPayloadFromStoredData($plan, true);
            try {
                $result = $this->sendInvoicePlanInternal($plan, $id, $payload, false);
                if (!empty($result['ok'])) {
                    $sent++;
                } else {
                    $skipped++;
                }
            } catch (Exception $e) {
                $errors[] = ['plan_id' => $id, 'message' => $e->getMessage()];
            }
        }

        sendJson([
            'ok' => true,
            'sent' => $sent,
            'skipped' => $skipped,
            'errors' => $errors
        ]);
    }

    private function performInvoicePlanSend(array $plan, int $id, array $payload)
    {
        $result = $this->sendInvoicePlanInternal($plan, $id, $payload);
        sendJson($result);
    }

    private function sendInvoicePlanInternal(array $plan, int $id, array $payload, bool $strict = true)
    {
        $items = isset($payload['items_snapshot']) && is_array($payload['items_snapshot'])
            ? $payload['items_snapshot']
            : json_decode((string)($plan['work_items_json'] ?? '[]'), true);
        if (!is_array($items) || empty($items)) {
            if ($strict) {
                sendError('VALIDATION_ERROR', 'Укажите строки работ', 422);
            }
            throw new RuntimeException('Укажите строки работ');
        }

        $email = isset($payload['email']) ? trim((string)$payload['email']) : (string)$plan['email'];
        $sendTelegram = !empty($payload['send_telegram']) ? 1 : 0;
        $sendDiadoc = !empty($payload['send_diadoc']) ? 1 : 0;

        $total = 0.0;
        foreach ($items as $line) {
            $total += (float)($line['amount'] ?? 0);
        }

        if ($total <= 0) {
            if ($strict) {
                sendError('VALIDATION_ERROR', 'Сумма счета должна быть больше 0', 422);
            }
            throw new RuntimeException('Сумма счета должна быть больше 0');
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
        $documentId = $this->plans->insertFinanceDocument($plan, $docNumber, $token, $total, $this->getOverdueDaysSetting());
        if ($documentId <= 0) {
            if ($strict) {
                sendError('DOCUMENT_CREATE_FAILED', 'Не удалось создать счет', 500);
            }
            throw new RuntimeException('Не удалось создать счет');
        }

        $sentOk = $this->plans->setSent($id, $documentId);
        if (!$sentOk) {
            if ($strict) {
                sendError('PLAN_STATUS_UPDATE_FAILED', 'Не удалось перевести счет в статус ожидания оплаты', 500);
            }
            throw new RuntimeException('Не удалось перевести счет в статус ожидания оплаты');
        }

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

        return [
            'ok' => true,
            'plan_id' => $id,
            'status' => 'sent_waiting_payment',
            'document_id' => $documentId
        ];
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

    public function projectsIndex()
    {
        Auth::requireAuth();
        sendJson(['data' => $this->projects->all()]);
    }

    public function projectStatuses()
    {
        Auth::requireAuth();
        sendJson(['data' => $this->projects->statuses()]);
    }

    public function projectsCreate()
    {
        Auth::requireAuth();
        $payload = getJsonPayload();
        $clientId = (int)($payload['client_id'] ?? 0);
        $name = trim((string)($payload['name'] ?? ''));
        $amount = (float)($payload['amount'] ?? 0);
        $items = isset($payload['work_items']) && is_array($payload['work_items']) ? $payload['work_items'] : [];

        if ($clientId <= 0 || $name === '' || $amount <= 0) {
            sendError('VALIDATION_ERROR', 'Заполните поля клиента, названия и суммы', 422);
        }

        if (empty($items)) {
            $items = [[
                'name' => $name,
                'amount' => $amount,
                'category' => ''
            ]];
        }

        $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);
        $id = $this->projects->create($clientId, $name, $amount, $itemsJson);
        if ($id <= 0) {
            sendError('CREATE_FAILED', 'Не удалось создать проект', 500);
        }

        sendJson(['ok' => true, 'id' => $id]);
    }

    public function projectsUpdate($id)
    {
        Auth::requireAuth();
        $project = $this->projects->find((int)$id);
        if (!$project) {
            sendError('NOT_FOUND', 'Проект не найден', 404);
        }

        $payload = getJsonPayload();
        $name = trim((string)($payload['name'] ?? $project['name']));
        $amount = (float)($payload['amount'] ?? $project['amount']);
        $status = trim((string)($payload['status'] ?? $project['status']));
        if ($status === 'in_work') $status = 'in_progress';
        if ($status === 'ready_to_invoice') $status = 'to_pay';
        if ($status !== 'in_progress' && $status !== 'to_pay') {
            $status = 'in_progress';
        }
        $items = isset($payload['work_items']) && is_array($payload['work_items'])
            ? $payload['work_items']
            : json_decode((string)($project['work_items_json'] ?? '[]'), true);
        if (!is_array($items)) {
            $items = [];
        }
        $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);

        if ($name === '' || $amount <= 0) {
            sendError('VALIDATION_ERROR', 'Название и сумма проекта обязательны', 422);
        }

        $ok = $this->projects->updateEditable((int)$id, $name, $amount, $itemsJson, $status);
        if (!$ok) {
            sendError('UPDATE_FAILED', 'Не удалось обновить проект', 500);
        }

        sendJson(['ok' => true]);
    }

    public function projectsDelete($id)
    {
        Auth::requireAuth();
        $ok = $this->projects->delete((int)$id);
        if (!$ok) {
            sendError('DELETE_FAILED', 'Не удалось удалить проект', 500);
        }
        sendJson(['ok' => true]);
    }

    public function projectsSendInvoice($id)
    {
        Auth::requireAuth();
        $project = $this->projects->find((int)$id);
        if (!$project) {
            sendError('NOT_FOUND', 'Проект не найден', 404);
        }
        $payload = getJsonPayload();
        // For project-origin invoices we always treat send date as "today".
        $sendDate = date('Y-m-d');

        $periodYear = (int)date('Y', strtotime($sendDate));
        $periodMonth = (int)date('m', strtotime($sendDate));
        $periodLabel = sprintf('%02d.%04d', $periodMonth, $periodYear);

        $items = isset($payload['items_snapshot']) && is_array($payload['items_snapshot'])
            ? $payload['items_snapshot']
            : json_decode((string)($project['work_items_json'] ?? '[]'), true);
        if (!is_array($items) || empty($items)) {
            $items = [[
                'name' => (string)($project['name'] ?? 'Проектные работы'),
                'amount' => (float)($project['amount'] ?? 0),
                'category' => ''
            ]];
        }

        $channelsJson = json_encode([
            'email' => trim((string)($payload['email'] ?? ($project['email'] ?? ''))),
            'send_telegram' => !empty($payload['send_telegram']) ? 1 : (int)($project['send_invoice_telegram'] ?? 0),
            'send_diadoc' => !empty($payload['send_diadoc']) ? 1 : (int)($project['send_invoice_diadoc'] ?? 0)
        ], JSON_UNESCAPED_UNICODE);

        $planId = $this->plans->create(
            (int)$project['client_id'],
            $periodYear,
            $periodMonth,
            $periodLabel,
            json_encode($items, JSON_UNESCAPED_UNICODE),
            $channelsJson,
            $sendDate,
            'project'
        );
        if ($planId <= 0) {
            sendError('CREATE_FAILED', 'Не удалось создать счет по проекту', 500);
        }
        $plan = $this->plans->find($planId);

        if (!$plan) {
            sendError('NOT_FOUND', 'Созданный счет не найден', 404);
        }
        $result = $this->sendInvoicePlanInternal($plan, $planId, [
            'items_snapshot' => $items,
            'email' => (string)($payload['email'] ?? ($project['email'] ?? '')),
            'send_telegram' => !empty($payload['send_telegram']) || (int)($project['send_invoice_telegram'] ?? 0) === 1,
            'send_diadoc' => !empty($payload['send_diadoc']) || (int)($project['send_invoice_diadoc'] ?? 0) === 1,
            'send_date' => $sendDate,
            'send_now' => true
        ]);

        $this->projects->delete((int)$id);

        sendJson([
            'ok' => true,
            'project_id' => (int)$id,
            'plan' => $result
        ]);
    }

    private function buildRevenueTrendRows($months = 12)
    {
        $months = max(1, (int)$months);
        $startTs = strtotime(date('Y-m-01') . " - " . ($months - 1) . " months");
        $startDate = date('Y-m-01', $startTs);
        $historyStartDate = date('Y-m-01', strtotime($startDate . ' -12 months'));

        $range = [];
        for ($i = 0; $i < $months; $i++) {
            $ts = strtotime(date('Y-m-01', $startTs) . " + {$i} months");
            $year = (int)date('Y', $ts);
            $month = (int)date('n', $ts);
            $key = sprintf('%04d-%02d', $year, $month);
            $range[$key] = [
                'month' => $key,
                'month_name' => $this->formatMonthLabelRu($year, $month),
                'year' => $year,
                'month_num' => $month,
                'revenue' => 0.0,
                'confirmed' => 0.0,
                'projected' => 0.0,
                'previous_year' => 0.0,
            ];
        }

        $hasIsPaid = $this->hasFinanceDocColumn('is_paid');
        $hasPaidStatus = $this->hasFinanceDocColumn('paid_status');
        $hasPaidSum = $this->hasFinanceDocColumn('paid_sum');
        $paidAmountExpr = $hasPaidSum ? "COALESCE(d.paid_sum, d.total_sum, 0)" : "COALESCE(d.total_sum, 0)";
        if ($hasIsPaid && $hasPaidStatus) {
            $paidCond = "(COALESCE(d.is_paid, 0) = 1 OR d.paid_status = 'paid')";
        } elseif ($hasIsPaid) {
            $paidCond = "COALESCE(d.is_paid, 0) = 1";
        } elseif ($hasPaidStatus) {
            $paidCond = "d.paid_status = 'paid'";
        } else {
            $paidCond = "0 = 1";
        }

        $docsSentMap = [];
        $docsPaidMap = [];

        $sqlDocs = "SELECT YEAR(d.doc_date) AS y, MONTH(d.doc_date) AS m,
                           SUM(COALESCE(d.total_sum, 0)) AS sent_total,
                           SUM(CASE WHEN $paidCond THEN $paidAmountExpr ELSE 0 END) AS paid_total
                    FROM finance_documents d
                    WHERE d.doc_type = 'invoice'
                      AND d.doc_date >= ?
                    GROUP BY YEAR(d.doc_date), MONTH(d.doc_date)";
        $stmtDocs = $this->db->prepare($sqlDocs);
        if ($stmtDocs) {
            $stmtDocs->bind_param('s', $historyStartDate);
            $stmtDocs->execute();
            $res = $stmtDocs->get_result();
            while ($res && ($row = $res->fetch_assoc())) {
                $key = sprintf('%04d-%02d', (int)($row['y'] ?? 0), (int)($row['m'] ?? 0));
                $docsSentMap[$key] = (float)($row['sent_total'] ?? 0);
                $docsPaidMap[$key] = (float)($row['paid_total'] ?? 0);
            }
            $stmtDocs->close();
        }

        if ($this->hasInvoicePlanColumn('planned_send_date')
            && $this->hasInvoicePlanColumn('status')
            && $this->hasInvoicePlanColumn('total_sum')
        ) {
            $sqlPlanned = "SELECT YEAR(p.planned_send_date) AS y, MONTH(p.planned_send_date) AS m,
                                  SUM(COALESCE(p.total_sum, 0)) AS planned_total
                           FROM invoice_plans p
                           WHERE p.status = 'planned'
                             AND p.planned_send_date IS NOT NULL
                             AND p.planned_send_date >= ?
                           GROUP BY YEAR(p.planned_send_date), MONTH(p.planned_send_date)";
            $stmtPlanned = $this->db->prepare($sqlPlanned);
            if ($stmtPlanned) {
                $stmtPlanned->bind_param('s', $startDate);
                $stmtPlanned->execute();
                $res = $stmtPlanned->get_result();
                while ($res && ($row = $res->fetch_assoc())) {
                    $key = sprintf('%04d-%02d', (int)($row['y'] ?? 0), (int)($row['m'] ?? 0));
                    if (!isset($range[$key])) {
                        continue;
                    }
                    $planned = (float)($row['planned_total'] ?? 0);
                    $range[$key]['projected'] = $range[$key]['confirmed'] + $planned;
                }
                $stmtPlanned->close();
            }
        }

        foreach ($range as $key => &$row) {
            if (isset($docsSentMap[$key])) {
                $row['confirmed'] = (float)$docsSentMap[$key];
            }
            if (isset($docsPaidMap[$key])) {
                $row['revenue'] = (float)$docsPaidMap[$key];
            }
            if ((float)$row['projected'] <= 0) {
                $row['projected'] = (float)$row['confirmed'];
            }
            $prevKey = sprintf('%04d-%02d', (int)$row['year'] - 1, (int)$row['month_num']);
            if (isset($docsPaidMap[$prevKey])) {
                $row['previous_year'] = (float)$docsPaidMap[$prevKey];
            }
            unset($row['year'], $row['month_num']);
        }
        unset($row);

        return array_values($range);
    }

    private function formatMonthLabelRu($year, $month)
    {
        $m = (int)$month;
        $short = [
            1 => 'Янв',
            2 => 'Фев',
            3 => 'Мар',
            4 => 'Апр',
            5 => 'Май',
            6 => 'Июн',
            7 => 'Июл',
            8 => 'Авг',
            9 => 'Сен',
            10 => 'Окт',
            11 => 'Ноя',
            12 => 'Дек',
        ];
        $name = isset($short[$m]) ? $short[$m] : 'Мес';
        return $name . ' ' . (int)$year;
    }

    private function calcPercentChange($current, $base)
    {
        $current = (float)$current;
        $base = (float)$base;
        if (abs($base) < 0.000001) {
            return $current > 0 ? 100.0 : 0.0;
        }
        return round((($current - $base) / $base) * 100, 1);
    }

    private function getOverdueDaysSetting()
    {
        $sql = "SELECT finance_tbank_invoice_due_days AS due_days FROM crm_settings WHERE id = 1 LIMIT 1";
        $res = $this->db->query($sql);
        if ($res) {
            $row = $res->fetch_assoc();
            $res->close();
            $v = isset($row['due_days']) ? (int)$row['due_days'] : 0;
            if ($v >= 0) {
                return $v;
            }
        }
        return 3;
    }

    private function buildPlanPayloadFromStoredData(array $plan, $sendNow)
    {
        $items = json_decode((string)($plan['work_items_json'] ?? '[]'), true);
        if (!is_array($items)) {
            $items = [];
        }

        $channels = json_decode((string)($plan['channels_json'] ?? '{}'), true);
        if (!is_array($channels)) {
            $channels = [];
        }

        return [
            'items_snapshot' => $items,
            'email' => trim((string)($channels['email'] ?? ($plan['email'] ?? ''))),
            'send_telegram' => !empty($channels['send_telegram']),
            'send_diadoc' => !empty($channels['send_diadoc']),
            'send_date' => !empty($plan['planned_send_date']) ? (string)$plan['planned_send_date'] : date('Y-m-d'),
            'send_now' => (bool)$sendNow
        ];
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

    private function hasFinanceDocColumn($name)
    {
        $name = (string)$name;
        if ($name === '') {
            return false;
        }
        if ($this->financeDocColumns === null) {
            $this->financeDocColumns = [];
            $res = $this->db->query('SHOW COLUMNS FROM finance_documents');
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $this->financeDocColumns[(string)$row['Field']] = true;
                }
                $res->close();
            }
        }
        return isset($this->financeDocColumns[$name]);
    }

    private function hasSettingsColumn($name)
    {
        $name = (string)$name;
        if ($name === '') {
            return false;
        }
        if ($this->settingsColumns === null) {
            $this->settingsColumns = [];
            $res = $this->db->query('SHOW COLUMNS FROM crm_settings');
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $this->settingsColumns[(string)$row['Field']] = true;
                }
                $res->close();
            }
        }
        return isset($this->settingsColumns[$name]);
    }

    private function hasInvoicePlanColumn($name)
    {
        $name = (string)$name;
        if ($name === '') {
            return false;
        }
        if ($this->invoicePlanColumns === null) {
            $this->invoicePlanColumns = [];
            $res = $this->db->query('SHOW COLUMNS FROM invoice_plans');
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $this->invoicePlanColumns[(string)$row['Field']] = true;
                }
                $res->close();
            }
        }
        return isset($this->invoicePlanColumns[$name]);
    }

    private function repairMissingInvoicePlansFromDocuments()
    {
        if (!$this->hasInvoicePlanColumn('document_id')) {
            return;
        }
        $sql = "SELECT d.*, c.email, c.send_invoice_telegram, c.send_invoice_diadoc
                FROM finance_documents d
                INNER JOIN clients c ON c.id = d.client_id
                LEFT JOIN invoice_plans ip ON ip.document_id = d.id
                WHERE d.doc_type = 'invoice'
                  AND ip.id IS NULL
                ORDER BY d.id DESC
                LIMIT 2000";
        $res = $this->db->query($sql);
        if (!$res) {
            return;
        }

        while ($row = $res->fetch_assoc()) {
            $this->plans->ensurePlanByDocument($row, $row);
        }
        $res->close();
    }

    private function buildInvoiceUnpaidWhere($alias = 'd')
    {
        $alias = preg_replace('/[^a-zA-Z0-9_]/', '', (string)$alias);
        if ($alias === '') $alias = 'd';
        $hasIsPaid = $this->hasFinanceDocColumn('is_paid');
        $hasPaidStatus = $this->hasFinanceDocColumn('paid_status');
        if ($hasIsPaid && $hasPaidStatus) {
            return "(NOT (COALESCE({$alias}.is_paid, 0) = 1 OR {$alias}.paid_status = 'paid'))";
        }
        if ($hasIsPaid) {
            return "(COALESCE({$alias}.is_paid, 0) = 0)";
        }
        if ($hasPaidStatus) {
            return "({$alias}.paid_status IS NULL OR {$alias}.paid_status <> 'paid')";
        }
        return "1 = 1";
    }

    private function getBankOperationColumns()
    {
        if ($this->bankOperationColumns !== null) {
            return $this->bankOperationColumns;
        }
        $cols = [];
        $res = $this->db->query('SHOW COLUMNS FROM finance_bank_operations');
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $cols[(string)$row['Field']] = true;
            }
            $res->close();
        }
        $this->bankOperationColumns = $cols;
        return $cols;
    }

    private function hasBankOperationColumn($name)
    {
        $name = (string)$name;
        if ($name === '') return false;
        $cols = $this->getBankOperationColumns();
        return isset($cols[$name]);
    }

    private function upsertBankOperation(array $op)
    {
        $type = strtolower(trim((string)($op['operationType'] ?? $op['direction'] ?? $op['type'] ?? '')));
        $isIncome = true;
        if ($type !== '') {
            $isIncome = (strpos($type, 'credit') !== false || strpos($type, 'income') !== false || strpos($type, 'in') === 0 || strpos($type, 'приход') !== false);
        }
        if (!$isIncome) {
            return '';
        }

        $amountRaw = $op['amount'] ?? null;
        if (is_array($amountRaw)) {
            $amountRaw = $amountRaw['value'] ?? $amountRaw['amount'] ?? null;
        }
        $amount = (float)$amountRaw;
        if ($amount <= 0) {
            return '';
        }

        $currency = strtoupper(trim((string)($op['currency'] ?? ($op['amount']['currency'] ?? 'RUB'))));
        if ($currency === '') $currency = 'RUB';
        $opTime = $this->normalizeDateTimeValue((string)($op['operationDate'] ?? $op['operationTime'] ?? $op['date'] ?? date('Y-m-d H:i:s')));
        $accountNumber = trim((string)($op['accountNumber'] ?? ($op['account']['accountNumber'] ?? '')));
        $description = trim((string)($op['paymentPurpose'] ?? $op['description'] ?? $op['purpose'] ?? ''));
        $counterpartyName = trim((string)($op['counterpartyName'] ?? $op['payerName'] ?? ($op['counterparty']['name'] ?? '')));
        $counterpartyInn = trim((string)($op['counterpartyInn'] ?? $op['payerInn'] ?? ($op['counterparty']['inn'] ?? '')));
        $operationId = $this->resolveBankOperationId($op, $opTime, $amount, $currency, $accountNumber, $description, $counterpartyName, $counterpartyInn);
        if ($operationId === '') {
            return '';
        }
        $rawJson = json_encode($op, JSON_UNESCAPED_UNICODE);

        $fields = ['operation_id'];
        $values = [$operationId];
        $types = 's';
        $add = function ($field, $type, $value) use (&$fields, &$values, &$types) {
            $fields[] = $field;
            $values[] = $value;
            $types .= $type;
        };
        if ($this->hasBankOperationColumn('operation_time')) $add('operation_time', 's', $opTime);
        if ($this->hasBankOperationColumn('occurred_at')) $add('occurred_at', 's', $opTime);
        if ($this->hasBankOperationColumn('amount')) $add('amount', 'd', $amount);
        if ($this->hasBankOperationColumn('currency')) $add('currency', 's', $currency);
        if ($this->hasBankOperationColumn('account_number')) $add('account_number', 's', $accountNumber);
        if ($this->hasBankOperationColumn('description')) $add('description', 's', $description);
        if ($this->hasBankOperationColumn('purpose')) $add('purpose', 's', $description);
        if ($this->hasBankOperationColumn('counterparty_name')) $add('counterparty_name', 's', $counterpartyName);
        if ($this->hasBankOperationColumn('counterparty_inn')) $add('counterparty_inn', 's', $counterpartyInn);
        if ($this->hasBankOperationColumn('status')) $add('status', 's', (string)($op['status'] ?? ''));
        if ($this->hasBankOperationColumn('raw_json')) $add('raw_json', 's', $rawJson);
        if ($this->hasBankOperationColumn('created_at')) $add('created_at', 's', date('Y-m-d H:i:s'));

        $update = [];
        foreach ($fields as $f) {
            if ($f === 'operation_id' || $f === 'created_at') continue;
            $update[] = "$f = VALUES($f)";
        }
        $sql = "INSERT INTO finance_bank_operations (" . implode(',', $fields) . ")
                VALUES (" . implode(',', array_fill(0, count($fields), '?')) . ")
                ON DUPLICATE KEY UPDATE " . implode(', ', $update);
        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            return '';
        }
        $refs = [];
        $refs[] = &$types;
        foreach ($values as $k => $v) {
            $values[$k] = $v;
            $refs[] = &$values[$k];
        }
        call_user_func_array([$stmt, 'bind_param'], $refs);
        $stmt->execute();
        $stmt->close();
        return $operationId;
    }

    private function normalizeDateTimeValue($raw)
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

    private function resolveBankOperationId(array $op, $opTime, $amount, $currency, $accountNumber, $description, $counterpartyName, $counterpartyInn)
    {
        $operationId = trim((string)($op['operationId'] ?? $op['operation_id'] ?? $op['id'] ?? ''));
        if ($operationId !== '') {
            return substr($operationId, 0, 64);
        }

        $fingerprint = implode('|', [
            'ext',
            (string)$opTime,
            number_format((float)$amount, 2, '.', ''),
            strtoupper((string)$currency),
            preg_replace('/\s+/u', ' ', trim((string)$accountNumber)),
            preg_replace('/\s+/u', ' ', trim((string)$description)),
            preg_replace('/\s+/u', ' ', trim((string)$counterpartyName)),
            preg_replace('/\s+/u', ' ', trim((string)$counterpartyInn)),
        ]);
        return 'ext_' . sha1($fingerprint);
    }

    private function autoMatchBankOperation($operationId)
    {
        $timeCol = $this->hasBankOperationColumn('operation_time') ? 'operation_time' : ($this->hasBankOperationColumn('occurred_at') ? 'occurred_at' : 'created_at');
        $descCol = $this->hasBankOperationColumn('description') ? 'description' : ($this->hasBankOperationColumn('purpose') ? 'purpose' : "''");
        $innCol = $this->hasBankOperationColumn('counterparty_inn') ? 'counterparty_inn' : "''";
        $stmt = $this->db->prepare("SELECT operation_id, amount, $timeCol AS operation_time, $descCol AS description, $innCol AS counterparty_inn, matched_document_id
                                    FROM finance_bank_operations
                                    WHERE operation_id = ?
                                    LIMIT 1");
        if (!$stmt) return false;
        $stmt->bind_param('s', $operationId);
        $stmt->execute();
        $res = $stmt->get_result();
        $op = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        if (!$op) return false;
        if ((int)($op['matched_document_id'] ?? 0) > 0) return true;

        $purpose = (string)($op['description'] ?? '');
        $amount = (float)($op['amount'] ?? 0);
        $inn = trim((string)($op['counterparty_inn'] ?? ''));
        $paidAt = !empty($op['operation_time']) ? (string)$op['operation_time'] : date('Y-m-d H:i:s');

        // 1) Try match by invoice number in purpose.
        if ($purpose !== '') {
            $whereUnpaid = $this->buildInvoiceUnpaidWhere('d');
            $sql = "SELECT d.id
                    FROM finance_documents d
                    WHERE d.doc_type = 'invoice'
                      AND $whereUnpaid
                      AND ? LIKE CONCAT('%', d.doc_number, '%')
                    ORDER BY d.id DESC
                    LIMIT 2";
            $stmt = $this->db->prepare($sql);
            if ($stmt) {
                $stmt->bind_param('s', $purpose);
                $stmt->execute();
                $res = $stmt->get_result();
                $ids = [];
                while ($res && ($r = $res->fetch_assoc())) $ids[] = (int)$r['id'];
                $stmt->close();
                if (count($ids) === 1) {
                    return $this->applyOperationToDocument($operationId, $ids[0], $amount, $paidAt, 'doc_number');
                }
            }
        }

        // 2) Try strict INN + exact amount unique match.
        if ($inn !== '' && $amount > 0) {
            $whereUnpaid = $this->buildInvoiceUnpaidWhere('d');
            $sql = "SELECT d.id
                    FROM finance_documents d
                    INNER JOIN clients c ON c.id = d.client_id
                    WHERE d.doc_type = 'invoice'
                      AND $whereUnpaid
                      AND c.inn = ?
                      AND ABS(d.total_sum - ?) < 0.01
                    ORDER BY d.id DESC
                    LIMIT 2";
            $stmt = $this->db->prepare($sql);
            if ($stmt) {
                $stmt->bind_param('sd', $inn, $amount);
                $stmt->execute();
                $res = $stmt->get_result();
                $ids = [];
                while ($res && ($r = $res->fetch_assoc())) $ids[] = (int)$r['id'];
                $stmt->close();
                if (count($ids) === 1) {
                    return $this->applyOperationToDocument($operationId, $ids[0], $amount, $paidAt, 'inn_amount');
                }
            }
        }

        return false;
    }

    private function applyOperationToDocument($operationId, $documentId, $amount, $paidAt, $method)
    {
        $documentId = (int)$documentId;
        if ($documentId <= 0) return false;

        $this->db->begin_transaction();
        try {
            $this->docs->updateById($documentId, [
                'is_paid' => 1,
                'paid_status' => 'paid',
                'paid_sum' => (float)$amount,
                'paid_at' => (string)$paidAt
            ]);

            if ($this->hasInvoicePlanColumn('document_id') && $this->hasInvoicePlanColumn('status')) {
                $stmt = $this->db->prepare("UPDATE invoice_plans SET status = 'paid', updated_at = NOW() WHERE document_id = ?");
                if ($stmt) {
                    $stmt->bind_param('i', $documentId);
                    $stmt->execute();
                    $stmt->close();
                }
            }

            $stmt = $this->db->prepare("UPDATE finance_bank_operations
                                        SET matched_document_id = ?, match_method = ?, matched_at = NOW()
                                        WHERE operation_id = ?");
            if (!$stmt) {
                throw new RuntimeException('operation update failed');
            }
            $method = (string)$method;
            $stmt->bind_param('iss', $documentId, $method, $operationId);
            $stmt->execute();
            $stmt->close();

            $this->db->commit();
            return true;
        } catch (Throwable $e) {
            $this->db->rollback();
            return false;
        }
    }

    private function bindStmtParams(mysqli_stmt $stmt, $types, array $params)
    {
        if ($types === '' || empty($params)) {
            return;
        }
        $refs = [];
        $refs[] = &$types;
        foreach ($params as $k => $value) {
            $refs[] = &$params[$k];
        }
        call_user_func_array([$stmt, 'bind_param'], $refs);
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
