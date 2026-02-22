<?php

class FinanceSendEventModel
{
    private $db;
    private $columnsCache = null;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
    }

    public function getOrCreate($documentId, $channel, $recipient)
    {
        $documentId = (int) $documentId;
        $channel = (string) $channel;
        $recipient = trim((string) $recipient);

        $recipientHash = sha1($channel . '|' . mb_strtolower($recipient));
        $stmt = $this->db->prepare("SELECT * FROM finance_send_events WHERE document_id = ? AND channel = ? AND recipient_hash = ? LIMIT 1");
        $stmt->bind_param("iss", $documentId, $channel, $recipientHash);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();

        if ($row) {
            return $row;
        }

        $cols = $this->getColumns();
        $openToken = null;
        if ($channel === 'email' && isset($cols['open_token'])) {
            $openToken = bin2hex(random_bytes(16));
        }

        $createdAt = date('Y-m-d H:i:s');
        $status = 'pending';
        $attempts = 0;

        // Минимальный INSERT с учетом возможных колонок.
        $fields = ['document_id', 'channel', 'recipient', 'recipient_hash', 'status', 'attempts', 'created_at'];
        $values = [$documentId, $channel, $recipient, $recipientHash, $status, $attempts, $createdAt];
        $types  = "issssis";

        if (isset($cols['open_token'])) {
            $fields[] = 'open_token';
            $values[] = (string) $openToken;
            $types   .= "s";
        }

        if (isset($cols['updated_at'])) {
            $fields[] = 'updated_at';
            $values[] = $createdAt;
            $types   .= "s";
        }

        $sql = "INSERT INTO finance_send_events (" . implode(',', $fields) . ") VALUES (" . implode(',', array_fill(0, count($fields), '?')) . ")";
        $stmt = $this->db->prepare($sql);
        $this->bindParams($stmt, $types, $values);
        $stmt->execute();
        $id = (int) $stmt->insert_id;
        $stmt->close();

        return $this->findById($id);
    }

    public function findById($id)
    {
        $id = (int) $id;
        $stmt = $this->db->prepare("SELECT * FROM finance_send_events WHERE id = ? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        return $row ?: null;
    }

    public function markSuccess($eventId, $responseJson = null)
    {
        $eventId = (int) $eventId;
        $now = date('Y-m-d H:i:s');

        $cols = $this->getColumns();
        $sets = ["status = 'success'", "success_at = ?", "last_attempt_at = ?", "attempts = attempts + 1"];
        $types = "ss";
        $vals = [$now, $now];

        if (isset($cols['response_json'])) {
            $sets[] = "response_json = ?";
            $types .= "s";
            $vals[] = $responseJson !== null ? (string) $responseJson : '';
        }
        if (isset($cols['last_error'])) {
            $sets[] = "last_error = ''";
        }
        if (isset($cols['updated_at'])) {
            $sets[] = "updated_at = ?";
            $types .= "s";
            $vals[] = $now;
        }

        $types .= "i";
        $vals[] = $eventId;

        $sql = "UPDATE finance_send_events SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $this->bindParams($stmt, $types, $vals);
        $stmt->execute();
        $stmt->close();
    }

    public function markFail($eventId, $error, $responseJson = null)
    {
        $eventId = (int) $eventId;
        $now = date('Y-m-d H:i:s');

        $cols = $this->getColumns();
        $sets = ["status = 'failed'", "last_attempt_at = ?", "attempts = attempts + 1"];
        $types = "s";
        $vals = [$now];

        if (isset($cols['last_error'])) {
            $sets[] = "last_error = ?";
            $types .= "s";
            $vals[] = substr((string) $error, 0, 2000);
        }
        if (isset($cols['response_json'])) {
            $sets[] = "response_json = ?";
            $types .= "s";
            $vals[] = $responseJson !== null ? (string) $responseJson : '';
        }
        if (isset($cols['updated_at'])) {
            $sets[] = "updated_at = ?";
            $types .= "s";
            $vals[] = $now;
        }

        $types .= "i";
        $vals[] = $eventId;

        $sql = "UPDATE finance_send_events SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $this->bindParams($stmt, $types, $vals);
        $stmt->execute();
        $stmt->close();
    }

    public function markEmailOpenedByToken($openToken, $ip, $ua)
    {
        $openToken = trim((string) $openToken);
        if ($openToken === '') {
            return;
        }

        $cols = $this->getColumns();

        $stmt = $this->db->prepare("SELECT id, opened_at FROM finance_send_events WHERE open_token = ? LIMIT 1");
        $stmt->bind_param("s", $openToken);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();

        if (!$row) {
            return;
        }

        $id = (int) $row['id'];
        $now = date('Y-m-d H:i:s');

        if (isset($cols['opened_at']) && empty($row['opened_at'])) {
            $stmt = $this->db->prepare("UPDATE finance_send_events SET opened_at = ?, updated_at = ? WHERE id = ?");
            $stmt->bind_param("ssi", $now, $now, $id);
            $stmt->execute();
            $stmt->close();
        }

        if ($this->tableExists('finance_email_open_events')) {
            $ip = substr((string) $ip, 0, 191);
            $ua = substr((string) $ua, 0, 500);
            $stmt = $this->db->prepare("INSERT INTO finance_email_open_events (send_event_id, ip, user_agent, created_at) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("isss", $id, $ip, $ua, $now);
            $stmt->execute();
            $stmt->close();
        }
    }

    private function getColumns()
    {
        if ($this->columnsCache !== null) {
            return $this->columnsCache;
        }

        $cols = [];
        $res = $this->db->query("SHOW COLUMNS FROM finance_send_events");
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
