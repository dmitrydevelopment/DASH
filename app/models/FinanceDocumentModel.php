<?php

class FinanceDocumentModel
{
    private $db;
    private $columnsCache = null;
    private $downloadColumnsCache = null;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
    }

    public function findByDownloadToken($token)
    {
        $stmt = $this->db->prepare("SELECT * FROM finance_documents WHERE download_token = ? LIMIT 1");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        return $row ?: null;
    }

    public function findByPeriod($docType, $clientId, $year, $month)
    {
        $stmt = $this->db->prepare("SELECT * FROM finance_documents WHERE doc_type = ? AND client_id = ? AND period_year = ? AND period_month = ? LIMIT 1");
        $stmt->bind_param("siii", $docType, $clientId, $year, $month);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        return $row ?: null;
    }

    public function insert(array $data)
    {
        $cols = $this->getColumns();

        $allowed = [];
        foreach ($data as $k => $v) {
            if (isset($cols[$k])) {
                $allowed[$k] = $v;
            }
        }

        if (!isset($allowed['created_at']) && isset($cols['created_at'])) {
            $allowed['created_at'] = date('Y-m-d H:i:s');
        }
        if (!isset($allowed['updated_at']) && isset($cols['updated_at'])) {
            $allowed['updated_at'] = date('Y-m-d H:i:s');
        }

        $fields = array_keys($allowed);
        if (!$fields) {
            throw new RuntimeException("finance_documents insert: нет полей для вставки");
        }

        $placeholders = implode(',', array_fill(0, count($fields), '?'));
        $sql = "INSERT INTO finance_documents (" . implode(',', $fields) . ") VALUES ($placeholders)";
        $stmt = $this->db->prepare($sql);

        $types = '';
        $values = [];
        foreach ($fields as $f) {
            $val = $allowed[$f];
            $values[] = $val;
            if (is_int($val)) $types .= 'i';
            elseif (is_float($val)) $types .= 'd';
            else $types .= 's';
        }

        $this->bindParams($stmt, $types, $values);
        $stmt->execute();
        $id = (int) $stmt->insert_id;
        $stmt->close();

        return $id;
    }

    public function updateById($id, array $data)
    {
        $cols = $this->getColumns();

        $allowed = [];
        foreach ($data as $k => $v) {
            if (isset($cols[$k])) {
                $allowed[$k] = $v;
            }
        }

        if (isset($cols['updated_at'])) {
            $allowed['updated_at'] = date('Y-m-d H:i:s');
        }

        if (!$allowed) {
            return false;
        }

        $sets = [];
        $types = '';
        $values = [];
        foreach ($allowed as $k => $v) {
            $sets[] = "$k = ?";
            $values[] = $v;
            if (is_int($v)) $types .= 'i';
            elseif (is_float($v)) $types .= 'd';
            else $types .= 's';
        }

        $types .= 'i';
        $values[] = (int) $id;

        $sql = "UPDATE finance_documents SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $this->bindParams($stmt, $types, $values);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function getAbsoluteFilePath(array $doc)
    {
        if (empty($doc['file_rel_path'])) {
            return null;
        }

        $rel = ltrim((string) $doc['file_rel_path'], '/');
        $abs = rtrim(APP_BASE_PATH, '/') . '/' . $rel;

        // Простая защита от выхода за пределы проекта
        $realBase = realpath(APP_BASE_PATH);
        $realFile = realpath($abs);
        if ($realBase && $realFile && strpos($realFile, $realBase) !== 0) {
            return null;
        }

        return $abs;
    }

    public function logDownload($documentId, $ip, $ua)
    {
        if (!$this->tableExists('finance_download_events')) {
            return;
        }

        $cols = $this->getDownloadEventColumns();
        if (empty($cols)) {
            return;
        }

        $fields = [];
        $values = [];
        $types = '';

        $append = function ($field, $type, $value) use (&$fields, &$values, &$types, $cols) {
            if (!isset($cols[$field])) {
                return;
            }
            $fields[] = $field;
            $values[] = $value;
            $types .= $type;
        };

        $append('document_id', 'i', (int)$documentId);
        $append('ip', 's', substr((string)$ip, 0, 191));
        $append('user_agent', 's', substr((string)$ua, 0, 500));

        if (isset($cols['created_at'])) {
            $append('created_at', 's', date('Y-m-d H:i:s'));
        }

        if (empty($fields)) {
            return;
        }

        $placeholders = implode(',', array_fill(0, count($fields), '?'));
        $sql = 'INSERT INTO finance_download_events (' . implode(',', $fields) . ') VALUES (' . $placeholders . ')';
        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            return;
        }

        $this->bindParams($stmt, $types, $values);
        $stmt->execute();
        $stmt->close();
    }

    private function getDownloadEventColumns()
    {
        if ($this->downloadColumnsCache !== null) {
            return $this->downloadColumnsCache;
        }

        $cols = [];
        $res = $this->db->query('SHOW COLUMNS FROM finance_download_events');
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $cols[(string)$row['Field']] = true;
            }
            $res->close();
        }

        $this->downloadColumnsCache = $cols;
        return $cols;
    }

    private function getColumns()
    {
        if ($this->columnsCache !== null) {
            return $this->columnsCache;
        }

        $cols = [];
        $res = $this->db->query("SHOW COLUMNS FROM finance_documents");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $cols[$row['Field']] = true;
            }
            $res->close();
        }

        $this->columnsCache = $cols;
        return $cols;
    }

    private function tableExists($table)
    {
        $table = $this->db->real_escape_string($table);
        $res = $this->db->query("SHOW TABLES LIKE '{$table}'");
        $ok = $res && $res->num_rows > 0;
        if ($res) $res->close();
        return $ok;
    }

    private function bindParams(mysqli_stmt $stmt, $types, array $values)
    {
        $refs = [];
        $refs[] = &$types;
        for ($i = 0; $i < count($values); $i++) {
            $refs[] = &$values[$i];
        }
        call_user_func_array([$stmt, 'bind_param'], $refs);
    }
}
