<?php

require_once APP_BASE_PATH . '/app/models/FinanceDocumentModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceSendEventModel.php';
require_once APP_BASE_PATH . '/app/auth/Auth.php';

class FinanceController
{
    private $docs;
    private $events;
    private $db;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
        $this->docs = new FinanceDocumentModel($db);
        $this->events = new FinanceSendEventModel($db);
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


    /**
     * GET /finance/documents
     */
    public function documents()
    {
        Auth::requireAuth();

        $docType = isset($_GET['doc_type']) ? trim((string) $_GET['doc_type']) : '';
        $clientId = isset($_GET['client_id']) ? (int) $_GET['client_id'] : 0;
        $year = isset($_GET['period_year']) ? (int) $_GET['period_year'] : 0;
        $month = isset($_GET['period_month']) ? (int) $_GET['period_month'] : 0;
        $page = max(1, isset($_GET['page']) ? (int) $_GET['page'] : 1);
        $perPage = max(1, min(100, isset($_GET['per_page']) ? (int) $_GET['per_page'] : 20));

        $where = [];
        $types = '';
        $values = [];

        if ($docType !== '' && in_array($docType, ['invoice', 'act'], true)) {
            $where[] = 'd.doc_type = ?';
            $types .= 's';
            $values[] = $docType;
        }
        if ($clientId > 0) {
            $where[] = 'd.client_id = ?';
            $types .= 'i';
            $values[] = $clientId;
        }
        if ($year > 0) {
            $where[] = 'd.period_year = ?';
            $types .= 'i';
            $values[] = $year;
        }
        if ($month > 0) {
            $where[] = 'd.period_month = ?';
            $types .= 'i';
            $values[] = $month;
        }

        $whereSql = empty($where) ? '' : (' WHERE ' . implode(' AND ', $where));
        $offset = ($page - 1) * $perPage;

        $countSql = 'SELECT COUNT(*) AS cnt FROM finance_documents d' . $whereSql;
        $listSql = 'SELECT d.*, c.name AS client_name FROM finance_documents d INNER JOIN clients c ON c.id = d.client_id'
            . $whereSql
            . ' ORDER BY d.doc_date DESC, d.id DESC LIMIT ? OFFSET ?';

        $total = $this->fetchCount($countSql, $types, $values);
        $items = $this->fetchDocumentsList($listSql, $types . 'ii', array_merge($values, [$perPage, $offset]));

        sendJson([
            'success' => true,
            'data' => [
                'items' => $items,
                'pagination' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'pages' => $perPage > 0 ? (int) ceil($total / $perPage) : 1,
                ],
            ],
        ]);
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


    private function fetchCount(string $sql, string $types, array $values): int
    {
        $stmt = $this->db->prepare($sql);
        if ($types !== '') {
            $this->bindParams($stmt, $types, $values);
        }
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        return $row ? (int) $row['cnt'] : 0;
    }

    private function fetchDocumentsList(string $sql, string $types, array $values): array
    {
        $stmt = $this->db->prepare($sql);
        $this->bindParams($stmt, $types, $values);
        $stmt->execute();
        $res = $stmt->get_result();
        $out = [];
        while ($res && ($row = $res->fetch_assoc())) {
            $out[] = [
                'id' => (int) $row['id'],
                'doc_type' => (string) $row['doc_type'],
                'client_id' => (int) $row['client_id'],
                'client_name' => (string) ($row['client_name'] ?? ''),
                'period_year' => (int) $row['period_year'],
                'period_month' => (int) $row['period_month'],
                'doc_date' => (string) $row['doc_date'],
                'due_date' => $row['due_date'] ? (string) $row['due_date'] : null,
                'doc_number' => (string) $row['doc_number'],
                'total_sum' => (float) $row['total_sum'],
                'currency' => (string) $row['currency'],
                'is_paid' => (int) $row['is_paid'],
                'paid_at' => $row['paid_at'] ? (string) $row['paid_at'] : null,
                'download_token' => (string) $row['download_token'],
                'created_at' => (string) $row['created_at'],
            ];
        }
        $stmt->close();
        return $out;
    }

    private function bindParams(mysqli_stmt $stmt, string $types, array $values): void
    {
        $refs = [];
        $refs[] = &$types;
        foreach ($values as $i => $v) {
            $refs[] = &$values[$i];
        }
        call_user_func_array([$stmt, 'bind_param'], $refs);
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
