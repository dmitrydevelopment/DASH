<?php

require_once APP_BASE_PATH . '/app/models/FinanceDocumentModel.php';
require_once APP_BASE_PATH . '/app/models/FinanceSendEventModel.php';

class FinanceController
{
    private $docs;
    private $events;

    public function __construct(mysqli $db)
    {
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
