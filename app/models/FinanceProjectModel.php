<?php

class FinanceProjectModel
{
    private $db;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
    }

    public function all()
    {
        $sql = "SELECT fp.*, c.name AS client_name, c.email, c.chat_id, c.send_invoice_telegram, c.send_invoice_diadoc
                FROM finance_projects fp
                INNER JOIN clients c ON c.id = fp.client_id
                ORDER BY fp.created_at DESC, fp.id DESC";
        $res = $this->db->query($sql);
        $rows = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $rows[] = $row;
            }
            $res->close();
        }
        return $rows;
    }

    public function find($id)
    {
        $stmt = $this->db->prepare("SELECT fp.*, c.name AS client_name, c.email, c.chat_id, c.send_invoice_telegram, c.send_invoice_diadoc
                                    FROM finance_projects fp
                                    INNER JOIN clients c ON c.id = fp.client_id
                                    WHERE fp.id = ?
                                    LIMIT 1");
        if (!$stmt) {
            return null;
        }
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        return $row ?: null;
    }

    public function create($clientId, $name, $amount, $workItemsJson)
    {
        $stmt = $this->db->prepare("INSERT INTO finance_projects
            (client_id, name, amount, work_items_json, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'in_work', NOW(), NOW())");
        if (!$stmt) {
            return 0;
        }
        $stmt->bind_param('isds', $clientId, $name, $amount, $workItemsJson);
        $ok = $stmt->execute();
        $id = $ok ? (int)$this->db->insert_id : 0;
        $stmt->close();
        return $id;
    }

    public function updateEditable($id, $name, $amount, $workItemsJson)
    {
        $stmt = $this->db->prepare("UPDATE finance_projects
            SET name = ?, amount = ?, work_items_json = ?, updated_at = NOW()
            WHERE id = ?");
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('sdsi', $name, $amount, $workItemsJson, $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function setStatus($id, $status)
    {
        $stmt = $this->db->prepare("UPDATE finance_projects
            SET status = ?, updated_at = NOW()
            WHERE id = ?");
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('si', $status, $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM finance_projects WHERE id = ?");
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('i', $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }
}
