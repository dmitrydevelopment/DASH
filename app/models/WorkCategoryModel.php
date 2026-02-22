<?php

class WorkCategoryModel
{
    /** @var mysqli */
    private $db;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
    }

    public function all(bool $includeInactive = false): array
    {
        $sql = "SELECT id, name, tag, sort_order, is_active, created_at, updated_at
                FROM crm_work_categories";
        if (!$includeInactive) {
            $sql .= " WHERE is_active = 1";
        }
        $sql .= " ORDER BY sort_order ASC, id ASC";

        $res = $this->db->query($sql);
        $out = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $out[] = $this->normalizeRow($row);
            }
            $res->close();
        }
        return $out;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT id, name, tag, sort_order, is_active, created_at, updated_at FROM crm_work_categories WHERE id = ? LIMIT 1");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();

        return $row ? $this->normalizeRow($row) : null;
    }

    public function existsTag(string $tag, ?int $excludeId = null): bool
    {
        if ($excludeId !== null) {
            $stmt = $this->db->prepare("SELECT id FROM crm_work_categories WHERE tag = ? AND id <> ? LIMIT 1");
            $stmt->bind_param('si', $tag, $excludeId);
        } else {
            $stmt = $this->db->prepare("SELECT id FROM crm_work_categories WHERE tag = ? LIMIT 1");
            $stmt->bind_param('s', $tag);
        }
        $stmt->execute();
        $res = $stmt->get_result();
        $exists = $res && $res->num_rows > 0;
        $stmt->close();

        return $exists;
    }

    public function create(array $data): ?array
    {
        $stmt = $this->db->prepare(
            "INSERT INTO crm_work_categories (name, tag, sort_order, is_active) VALUES (?, ?, ?, ?)"
        );
        $stmt->bind_param(
            'ssii',
            $data['name'],
            $data['tag'],
            $data['sort_order'],
            $data['is_active']
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
        $stmt = $this->db->prepare(
            "UPDATE crm_work_categories SET name = ?, tag = ?, sort_order = ?, is_active = ?, updated_at = NOW() WHERE id = ?"
        );
        $stmt->bind_param(
            'ssiii',
            $data['name'],
            $data['tag'],
            $data['sort_order'],
            $data['is_active'],
            $id
        );
        $ok = $stmt->execute();
        $stmt->close();
        return (bool) $ok;
    }

    public function softDelete(int $id): bool
    {
        $stmt = $this->db->prepare("UPDATE crm_work_categories SET is_active = 0, updated_at = NOW() WHERE id = ?");
        $stmt->bind_param('i', $id);
        $ok = $stmt->execute();
        $stmt->close();
        return (bool) $ok;
    }

    private function normalizeRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'tag' => (string) $row['tag'],
            'sort_order' => (int) $row['sort_order'],
            'is_active' => (int) $row['is_active'],
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }
}
