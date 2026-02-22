<?php

class PlannedInvoiceModel
{
    /** @var mysqli */
    private $db;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
    }

    public function list(array $filters = []): array
    {
        $where = [];
        $types = '';
        $values = [];

        if (!empty($filters['status'])) {
            $where[] = 'pi.status = ?';
            $types .= 's';
            $values[] = (string) $filters['status'];
        }
        if (!empty($filters['client_id'])) {
            $where[] = 'pi.client_id = ?';
            $types .= 'i';
            $values[] = (int) $filters['client_id'];
        }
        if (!empty($filters['period_year'])) {
            $where[] = 'pi.period_year = ?';
            $types .= 'i';
            $values[] = (int) $filters['period_year'];
        }
        if (!empty($filters['period_month'])) {
            $where[] = 'pi.period_month = ?';
            $types .= 'i';
            $values[] = (int) $filters['period_month'];
        }

        $sql = "SELECT pi.*, c.name AS client_name
                FROM finance_planned_invoices pi
                INNER JOIN clients c ON c.id = pi.client_id";
        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY pi.created_at DESC, pi.id DESC';

        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            return [];
        }

        if ($types !== '') {
            $this->bindParams($stmt, $types, $values);
        }

        $stmt->execute();
        $res = $stmt->get_result();
        $out = [];
        while ($row = $res->fetch_assoc()) {
            $out[] = $this->normalizeRow($row);
        }
        $stmt->close();
        return $out;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT pi.*, c.name AS client_name
             FROM finance_planned_invoices pi
             INNER JOIN clients c ON c.id = pi.client_id
             WHERE pi.id = ? LIMIT 1"
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();

        return $row ? $this->normalizeRow($row) : null;
    }


    public function findByClientPeriod(int $clientId, int $year, int $month): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT pi.*, c.name AS client_name
             FROM finance_planned_invoices pi
             INNER JOIN clients c ON c.id = pi.client_id
             WHERE pi.client_id = ? AND pi.period_year = ? AND pi.period_month = ?
             ORDER BY pi.id DESC LIMIT 1"
        );
        $stmt->bind_param('iii', $clientId, $year, $month);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        return $row ? $this->normalizeRow($row) : null;
    }

    public function create(array $data): ?array
    {
        $stmt = $this->db->prepare(
            "INSERT INTO finance_planned_invoices
            (client_id, period_year, period_month, planned_send_date, status, work_items_json, categories_json,
             total_sum, sent_at, due_date, payment_status_cached, payment_date_cached, days_overdue_cached,
             is_overdue_cached, linked_document_id, created_by_user_id, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->bind_param(
            'iiissssdssssiiiis',
            $data['client_id'],
            $data['period_year'],
            $data['period_month'],
            $data['planned_send_date'],
            $data['status'],
            $data['work_items_json'],
            $data['categories_json'],
            $data['total_sum'],
            $data['sent_at'],
            $data['due_date'],
            $data['payment_status_cached'],
            $data['payment_date_cached'],
            $data['days_overdue_cached'],
            $data['is_overdue_cached'],
            $data['linked_document_id'],
            $data['created_by_user_id'],
            $data['notes']
        );

        $ok = $stmt->execute();
        $id = (int) $stmt->insert_id;
        $stmt->close();

        if (!$ok) {
            return null;
        }

        return $this->findById($id);
    }

    public function update(int $id, array $data): bool
    {
        $fields = [];
        $types = '';
        $values = [];

        $map = [
            'planned_send_date' => 's',
            'status' => 's',
            'work_items_json' => 's',
            'categories_json' => 's',
            'total_sum' => 'd',
            'sent_at' => 's',
            'due_date' => 's',
            'payment_status_cached' => 's',
            'payment_date_cached' => 's',
            'days_overdue_cached' => 'i',
            'is_overdue_cached' => 'i',
            'linked_document_id' => 'i',
            'notes' => 's',
            'last_reminded_at' => 's',
        ];

        foreach ($map as $field => $type) {
            if (!array_key_exists($field, $data)) {
                continue;
            }
            $fields[] = $field . ' = ?';
            $types .= $type;
            $values[] = $data[$field];
        }

        if (empty($fields)) {
            return false;
        }

        $fields[] = 'updated_at = NOW()';
        $types .= 'i';
        $values[] = $id;

        $sql = 'UPDATE finance_planned_invoices SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            return false;
        }

        $this->bindParams($stmt, $types, $values);
        $ok = $stmt->execute();
        $stmt->close();
        return (bool) $ok;
    }

    public function archive(int $id): bool
    {
        return $this->update($id, ['status' => 'archived']);
    }

    private function normalizeRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'client_id' => (int) $row['client_id'],
            'client_name' => (string) ($row['client_name'] ?? ''),
            'period_year' => (int) $row['period_year'],
            'period_month' => (int) $row['period_month'],
            'planned_send_date' => $row['planned_send_date'] ? (string) $row['planned_send_date'] : null,
            'status' => (string) $row['status'],
            'work_items' => $this->jsonDecodeList($row['work_items_json'] ?? '[]'),
            'categories' => $this->jsonDecodeList($row['categories_json'] ?? '[]'),
            'total_sum' => isset($row['total_sum']) ? (float) $row['total_sum'] : 0.0,
            'sent_at' => $row['sent_at'] ? (string) $row['sent_at'] : null,
            'due_date' => $row['due_date'] ? (string) $row['due_date'] : null,
            'payment_status_cached' => $row['payment_status_cached'] ? (string) $row['payment_status_cached'] : null,
            'payment_date_cached' => $row['payment_date_cached'] ? (string) $row['payment_date_cached'] : null,
            'days_overdue_cached' => isset($row['days_overdue_cached']) ? (int) $row['days_overdue_cached'] : 0,
            'is_overdue_cached' => isset($row['is_overdue_cached']) ? (int) $row['is_overdue_cached'] : 0,
            'linked_document_id' => isset($row['linked_document_id']) ? (int) $row['linked_document_id'] : null,
            'last_reminded_at' => $row['last_reminded_at'] ? (string) $row['last_reminded_at'] : null,
            'created_by_user_id' => isset($row['created_by_user_id']) ? (int) $row['created_by_user_id'] : null,
            'notes' => (string) ($row['notes'] ?? ''),
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    private function jsonDecodeList(string $json): array
    {
        $decoded = json_decode($json, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function bindParams(mysqli_stmt $stmt, string $types, array $values): void
    {
        $refs = [];
        $refs[] = &$types;
        foreach ($values as $k => $v) {
            $refs[] = &$values[$k];
        }
        call_user_func_array([$stmt, 'bind_param'], $refs);
    }
}
