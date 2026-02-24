<?php

class InvoicePlanModel
{
    private $db;
    private $invoicePlanColumns = null;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
    }

    public function all()
    {
        $sql = "SELECT ip.*, c.name AS client_name, c.email, c.chat_id, c.diadoc_box_id, c.send_invoice_telegram, c.send_invoice_diadoc,
                       c.send_invoice_schedule, c.invoice_use_end_month_date,
                       fd_inv.file_rel_path AS invoice_file_rel_path,
                       fd_inv.download_token AS invoice_download_token,
                       (
                         SELECT fd_act.file_rel_path
                         FROM finance_documents fd_act
                         WHERE fd_act.doc_type = 'act'
                           AND fd_act.client_id = ip.client_id
                           AND fd_act.period_year = ip.period_year
                           AND fd_act.period_month = ip.period_month
                         ORDER BY fd_act.id DESC
                         LIMIT 1
                       ) AS act_file_rel_path,
                       (
                         SELECT fd_act.download_token
                         FROM finance_documents fd_act
                         WHERE fd_act.doc_type = 'act'
                           AND fd_act.client_id = ip.client_id
                           AND fd_act.period_year = ip.period_year
                           AND fd_act.period_month = ip.period_month
                         ORDER BY fd_act.id DESC
                         LIMIT 1
                       ) AS act_download_token
                FROM invoice_plans ip
                INNER JOIN clients c ON c.id = ip.client_id
                LEFT JOIN finance_documents fd_inv ON fd_inv.id = ip.document_id
                ORDER BY ip.status ASC, ip.created_at DESC, ip.id DESC";
        $res = $this->db->query($sql);
        $rows = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $rows[] = $row;
            }
        }
        return $rows;
    }

    public function find($id)
    {
        $stmt = $this->db->prepare("SELECT ip.*, c.name AS client_name, c.email, c.chat_id, c.diadoc_box_id, c.send_invoice_telegram, c.send_invoice_diadoc,
                                           c.send_invoice_schedule, c.invoice_use_end_month_date
                                    FROM invoice_plans ip
                                    INNER JOIN clients c ON c.id = ip.client_id
                                    WHERE ip.id = ? LIMIT 1");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();
        return $row ?: null;
    }

    private function getInvoicePlanColumns()
    {
        if ($this->invoicePlanColumns !== null) {
            return $this->invoicePlanColumns;
        }

        $cols = [];
        $res = $this->db->query('SHOW COLUMNS FROM invoice_plans');
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $cols[(string)$row['Field']] = true;
            }
            $res->close();
        }

        $this->invoicePlanColumns = $cols;
        return $cols;
    }

    public function create($clientId, $periodYear, $periodMonth, $periodLabel, $workItemsJson, $channelsJson, $plannedSendDate)
    {
        $cols = $this->getInvoicePlanColumns();
        $withPlanned = isset($cols['planned_send_date']);

        if ($withPlanned) {
            $stmt = $this->db->prepare("INSERT INTO invoice_plans
                (client_id, period_year, period_month, period_label, status, work_items_json, channels_json, planned_send_date, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'planned', ?, ?, ?, NOW(), NOW())");
            $stmt->bind_param('iiissss', $clientId, $periodYear, $periodMonth, $periodLabel, $workItemsJson, $channelsJson, $plannedSendDate);
        } else {
            $stmt = $this->db->prepare("INSERT INTO invoice_plans
                (client_id, period_year, period_month, period_label, status, work_items_json, channels_json, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'planned', ?, ?, NOW(), NOW())");
            $stmt->bind_param('iiisss', $clientId, $periodYear, $periodMonth, $periodLabel, $workItemsJson, $channelsJson);
        }

        if (!$stmt) {
            return 0;
        }

        $ok = $stmt->execute();
        $insertId = $ok ? (int)$this->db->insert_id : 0;
        $stmt->close();
        return $insertId;
    }

    public function updateEditable($id, $workItemsJson, $channelsJson, $plannedSendDate)
    {
        $cols = $this->getInvoicePlanColumns();
        $withPlanned = isset($cols['planned_send_date']);

        if ($withPlanned) {
            $stmt = $this->db->prepare("UPDATE invoice_plans
                SET work_items_json = ?, channels_json = ?, planned_send_date = ?, updated_at = NOW()
                WHERE id = ?");
            if (!$stmt) return false;
            $stmt->bind_param('sssi', $workItemsJson, $channelsJson, $plannedSendDate, $id);
        } else {
            $stmt = $this->db->prepare("UPDATE invoice_plans
                SET work_items_json = ?, channels_json = ?, updated_at = NOW()
                WHERE id = ?");
            if (!$stmt) return false;
            $stmt->bind_param('ssi', $workItemsJson, $channelsJson, $id);
        }

        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function setSent($id, $documentId)
    {
        $stmt = $this->db->prepare("UPDATE invoice_plans
            SET status = 'sent_waiting_payment', sent_at = NOW(), document_id = ?, updated_at = NOW()
            WHERE id = ?");
        $stmt->bind_param('ii', $documentId, $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM invoice_plans WHERE id = ?");
        $stmt->bind_param('i', $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function insertFinanceDocument($plan, $docNumber, $token, $totalSum)
    {
        $periodYear = (int)$plan['period_year'];
        $periodMonth = (int)$plan['period_month'];
        $clientId = (int)$plan['client_id'];
        $docDate = date('Y-m-d');
        $dueDate = date('Y-m-d', strtotime('+7 days'));
        $filePath = 'storage/finance/invoices/' . date('Y/m') . '/invoice_plan_' . $plan['id'] . '.pdf';

        $stmt = $this->db->prepare("INSERT INTO finance_documents
            (doc_type, client_id, period_year, period_month, doc_date, due_date, doc_number, total_sum, currency,
             file_rel_path, download_token, is_paid, paid_sum, created_at, updated_at)
            VALUES
            ('invoice', ?, ?, ?, ?, ?, ?, ?, 'RUB', ?, ?, 0, 0, NOW(), NOW())");

        $stmt->bind_param('iiisssdss', $clientId, $periodYear, $periodMonth, $docDate, $dueDate, $docNumber, $totalSum, $filePath, $token);

        $ok = $stmt->execute();
        $insertId = $ok ? (int)$this->db->insert_id : 0;
        $stmt->close();

        return $insertId;
    }

    public function insertSendEvent($documentId, $channel, $recipient, $status, $error = null)
    {
        $recipientHash = sha1(mb_strtolower((string)$recipient));
        $stmt = $this->db->prepare("INSERT INTO finance_send_events
            (document_id, channel, recipient, recipient_hash, status, attempts, last_attempt_at, success_at, last_error, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, NOW(), ?, ?, NOW(), NOW())");

        $successAt = $status === 'success' ? date('Y-m-d H:i:s') : null;
        $stmt->bind_param('issssss', $documentId, $channel, $recipient, $recipientHash, $status, $successAt, $error);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function fallbackBoardRows()
    {
        return [];
    }

    public function getClientInvoiceSums(array $clientIds)
    {
        $ids = array_values(array_unique(array_map('intval', $clientIds)));
        $ids = array_values(array_filter($ids, function ($id) {
            return $id > 0;
        }));
        if (empty($ids)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $types = str_repeat('i', count($ids));

        $sql = "SELECT client_id, SUM(service_price) AS total
                FROM client_invoice_items
                WHERE client_id IN ($placeholders)
                GROUP BY client_id";
        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            return [];
        }

        $params = [];
        $params[] = &$types;
        foreach ($ids as $k => $id) {
            $params[] = &$ids[$k];
        }
        call_user_func_array([$stmt, 'bind_param'], $params);

        $stmt->execute();
        $res = $stmt->get_result();
        $map = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $map[(int)$row['client_id']] = (float)$row['total'];
            }
            $res->close();
        }
        $stmt->close();

        return $map;
    }
}
