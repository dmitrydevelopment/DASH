<?php

class ClientModel
{
    /**
     * @var mysqli
     */
    private $db;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
    }

    public function getAll(): array
    {
        $sql = "
    SELECT
        c.*,
        e.full_name AS manager_full_name
    FROM clients c
    LEFT JOIN employees e ON e.id = c.manager_employee_id
    ORDER BY c.is_active DESC, c.name ASC
";

        $res = $this->db->query($sql);
        if (!$res) {
            return [];
        }

        $items = [];
        while ($row = $res->fetch_assoc()) {
            $items[] = $row;
        }

        return $items;
    }

    public function getById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT
                c.*,
                e.full_name AS manager_full_name
            FROM clients c
            LEFT JOIN employees e ON e.id = c.manager_employee_id
            WHERE c.id = ?
            LIMIT 1
        ");
        if (!$stmt) {
            return null;
        }

        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = ($res && $res->num_rows > 0) ? $res->fetch_assoc() : null;
        $stmt->close();

        return $row ?: null;
    }

    public function create(array $data): ?int
    {
        $name           = $this->nullIfEmpty($data['name'] ?? null);
        $legalName      = $this->nullIfEmpty($data['legal_name'] ?? null);
$inn            = $this->nullIfEmpty($data['inn'] ?? null);
$kpp            = $this->nullIfEmpty($data['kpp'] ?? null);
$diadocBoxId     = $this->nullIfEmpty($data['diadoc_box_id'] ?? null);
$diadocDepartmentId = $this->nullIfEmpty($data['diadoc_department_id'] ?? null);
        $contactPerson  = $this->nullIfEmpty($data['contact_person'] ?? null);

        $email          = $this->nullIfEmpty($data['email'] ?? null);
        $additionalEmail= $this->nullIfEmpty($data['additional_email'] ?? null);
        $phone          = $this->nullIfEmpty($data['phone'] ?? null);
        $industry       = $this->nullIfEmpty($data['industry'] ?? null);
        $website        = $this->nullIfEmpty($data['website'] ?? null);

        $managerId      = (int)($data['manager_employee_id'] ?? 0);
        $trackerProject = (int)($data['tracker_project_id'] ?? 0);
        $clientType = $this->nullIfEmpty($data['client_type'] ?? 'support');
if ($clientType !== 'project' && $clientType !== 'support') {
    $clientType = 'support';
}

        $telegramId     = $this->nullIfEmpty($data['telegram_id'] ?? null);
        $chatId         = $this->nullIfEmpty($data['chat_id'] ?? null);
        $sendInvoiceSchedule    = !empty($data['send_invoice_schedule']) ? 1 : 0;
$invoiceUseEndMonthDate = !empty($data['invoice_use_end_month_date']) ? 1 : 0;
$sendInvoiceTelegram    = !empty($data['send_invoice_telegram']) ? 1 : 0;
$sendInvoiceDiadoc      = !empty($data['send_invoice_diadoc']) ? 1 : 0;
$sendActDiadoc          = !empty($data['send_act_diadoc']) ? 1 : 0;

        $notes          = $this->nullIfEmpty($data['notes'] ?? null);
        $isActive       = !empty($data['is_active']) ? 1 : 0;

$stmt = $this->db->prepare("
    INSERT INTO clients
      (
        name, legal_name, inn, kpp, diadoc_box_id, diadoc_department_id,
        contact_person, email, additional_email, phone, industry, website,
        manager_employee_id, tracker_project_id, client_type,
        send_invoice_schedule, invoice_use_end_month_date, send_invoice_telegram, send_invoice_diadoc, send_act_diadoc,
        telegram_id, chat_id, notes, is_active
      )
    VALUES
      (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        NULLIF(?, 0), ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
");
if (!$stmt) {
    return null;
}

$stmt->bind_param(
    'ssssssssssssiisiiiiisssi',
    $name,
    $legalName,
    $inn,
    $kpp,
    $diadocBoxId,
    $diadocDepartmentId,
    $contactPerson,
    $email,
    $additionalEmail,
    $phone,
    $industry,
    $website,
    $managerId,
    $trackerProject,
    $clientType,
    $sendInvoiceSchedule,
    $invoiceUseEndMonthDate,
    $sendInvoiceTelegram,
    $sendInvoiceDiadoc,
    $sendActDiadoc,
    $telegramId,
    $chatId,
    $notes,
    $isActive
);

        $ok = $stmt->execute();
        $id = $ok ? (int)$stmt->insert_id : null;
        $stmt->close();

        return $id ?: null;
    }

    public function update(int $id, array $data): bool
    {
        $name           = $this->nullIfEmpty($data['name'] ?? null);
        $legalName      = $this->nullIfEmpty($data['legal_name'] ?? null);
$inn            = $this->nullIfEmpty($data['inn'] ?? null);
$kpp            = $this->nullIfEmpty($data['kpp'] ?? null);
$diadocBoxId     = $this->nullIfEmpty($data['diadoc_box_id'] ?? null);
$diadocDepartmentId = $this->nullIfEmpty($data['diadoc_department_id'] ?? null);
        $contactPerson  = $this->nullIfEmpty($data['contact_person'] ?? null);

        $email          = $this->nullIfEmpty($data['email'] ?? null);
        $additionalEmail= $this->nullIfEmpty($data['additional_email'] ?? null);
        $phone          = $this->nullIfEmpty($data['phone'] ?? null);
        $industry       = $this->nullIfEmpty($data['industry'] ?? null);
        $website        = $this->nullIfEmpty($data['website'] ?? null);
        $sendInvoiceSchedule    = !empty($data['send_invoice_schedule']) ? 1 : 0;
$invoiceUseEndMonthDate = !empty($data['invoice_use_end_month_date']) ? 1 : 0;
$sendInvoiceTelegram    = !empty($data['send_invoice_telegram']) ? 1 : 0;
$sendInvoiceDiadoc      = !empty($data['send_invoice_diadoc']) ? 1 : 0;
$sendActDiadoc          = !empty($data['send_act_diadoc']) ? 1 : 0;

        $managerId      = (int)($data['manager_employee_id'] ?? 0);
        $trackerProject = (int)($data['tracker_project_id'] ?? 0);
        $clientType = $this->nullIfEmpty($data['client_type'] ?? 'support');
if ($clientType !== 'project' && $clientType !== 'support') {
    $clientType = 'support';
}

        $telegramId     = $this->nullIfEmpty($data['telegram_id'] ?? null);
        $chatId         = $this->nullIfEmpty($data['chat_id'] ?? null);

        $notes          = $this->nullIfEmpty($data['notes'] ?? null);
        $isActive       = array_key_exists('is_active', $data) && !empty($data['is_active']) ? 1 : 0;

$stmt = $this->db->prepare("
    UPDATE clients
    SET
      name = ?,
      legal_name = ?,
      inn = ?,
      kpp = ?,
      diadoc_box_id = ?,
      diadoc_department_id = ?,
      contact_person = ?,
      email = ?,
      additional_email = ?,
      phone = ?,
      industry = ?,
      website = ?,
      manager_employee_id = NULLIF(?, 0),
      tracker_project_id = ?,
      client_type = ?,
      send_invoice_schedule = ?,
      invoice_use_end_month_date = ?,
      send_invoice_telegram = ?,
      send_invoice_diadoc = ?,
      send_act_diadoc = ?,
      telegram_id = ?,
      chat_id = ?,
      notes = ?,
      is_active = ?
    WHERE id = ?
");
if (!$stmt) {
    return false;
}

$stmt->bind_param(
    'ssssssssssssiisiiiiisssii',
    $name,
    $legalName,
    $inn,
    $kpp,
    $diadocBoxId,
    $diadocDepartmentId,
    $contactPerson,
    $email,
    $additionalEmail,
    $phone,
    $industry,
    $website,
    $managerId,
    $trackerProject,
    $clientType,
    $sendInvoiceSchedule,
    $invoiceUseEndMonthDate,
    $sendInvoiceTelegram,
    $sendInvoiceDiadoc,
    $sendActDiadoc,
    $telegramId,
    $chatId,
    $notes,
    $isActive,
    $id
);

        $ok = $stmt->execute();
        $stmt->close();

        return (bool)$ok;
    }

public function delete(int $id): bool
{
    $stmt = $this->db->prepare("DELETE FROM clients WHERE id = ?");
    if (!$stmt) {
        return false;
    }

    $stmt->bind_param('i', $id);
    $ok = $stmt->execute();
    $stmt->close();

    return (bool)$ok;
}

    private function nullIfEmpty($val)
    {
        if ($val === null) {
            return null;
        }

        $s = trim((string)$val);
        return ($s === '') ? null : $s;
    }

    public function getInvoiceItems(int $clientId): array
{
    $stmt = $this->db->prepare("SELECT id, service_name, service_price, sort_order FROM client_invoice_items WHERE client_id = ? ORDER BY sort_order ASC, id ASC");
    if (!$stmt) return [];
    $stmt->bind_param('i', $clientId);
    $stmt->execute();
    $res = $stmt->get_result();

    $items = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $items[] = [
                'id' => (int)$row['id'],
                'service_name' => $row['service_name'],
                'service_price' => $row['service_price'],
                'sort_order' => (int)$row['sort_order'],
            ];
        }
    }
    $stmt->close();
    return $items;
}

public function getActItems(int $clientId): array
{
    $stmt = $this->db->prepare("SELECT id, service_name, service_amount, sort_order FROM client_act_items WHERE client_id = ? ORDER BY sort_order ASC, id ASC");
    if (!$stmt) return [];
    $stmt->bind_param('i', $clientId);
    $stmt->execute();
    $res = $stmt->get_result();

    $items = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $items[] = [
                'id' => (int)$row['id'],
                'service_name' => $row['service_name'],
                'service_amount' => $row['service_amount'],
                'sort_order' => (int)$row['sort_order'],
            ];
        }
    }
    $stmt->close();
    return $items;
}

public function replaceInvoiceItems(int $clientId, array $items): bool
{
    $stmtDel = $this->db->prepare("DELETE FROM client_invoice_items WHERE client_id = ?");
    if (!$stmtDel) return false;
    $stmtDel->bind_param('i', $clientId);
    $ok = $stmtDel->execute();
    $stmtDel->close();
    if (!$ok) return false;

    $stmtIns = $this->db->prepare("INSERT INTO client_invoice_items (client_id, service_name, service_price, sort_order) VALUES (?, ?, ?, ?)");
    if (!$stmtIns) return false;

    $sort = 0;
    foreach ($items as $it) {
        $name = isset($it['service_name']) ? trim((string)$it['service_name']) : '';
        if ($name === '') continue;

        $priceRaw = $it['service_price'] ?? '0';
        $price = (float)str_replace(',', '.', (string)$priceRaw);

        $stmtIns->bind_param('isdi', $clientId, $name, $price, $sort);
        if (!$stmtIns->execute()) {
            $stmtIns->close();
            return false;
        }
        $sort++;
    }

    $stmtIns->close();
    return true;
}

public function replaceActItems(int $clientId, array $items): bool
{
    $stmtDel = $this->db->prepare("DELETE FROM client_act_items WHERE client_id = ?");
    if (!$stmtDel) return false;
    $stmtDel->bind_param('i', $clientId);
    $ok = $stmtDel->execute();
    $stmtDel->close();
    if (!$ok) return false;

    $stmtIns = $this->db->prepare("INSERT INTO client_act_items (client_id, service_name, service_amount, sort_order) VALUES (?, ?, ?, ?)");
    if (!$stmtIns) return false;

    $sort = 0;
    foreach ($items as $it) {
        $name = isset($it['service_name']) ? trim((string)$it['service_name']) : '';
        if ($name === '') continue;

        $amountRaw = $it['service_amount'] ?? '0';
        $amount = (float)str_replace(',', '.', (string)$amountRaw);

        $stmtIns->bind_param('isdi', $clientId, $name, $amount, $sort);
        if (!$stmtIns->execute()) {
            $stmtIns->close();
            return false;
        }
        $sort++;
    }

    $stmtIns->close();
    return true;
}
public function getStats(): array
{
    $sql = "
        SELECT
            SUM(is_active = 1) AS active_total,
            SUM(is_active = 1 AND client_type = 'project') AS active_projects,
            SUM(is_active = 1 AND client_type = 'support') AS active_support
        FROM clients
    ";

    $res = $this->db->query($sql);
    if (!$res) {
        return [
            'active_total' => 0,
            'active_projects' => 0,
            'active_support' => 0,
        ];
    }

    $row = $res->fetch_assoc();
    return [
        'active_total' => (int)($row['active_total'] ?? 0),
        'active_projects' => (int)($row['active_projects'] ?? 0),
        'active_support' => (int)($row['active_support'] ?? 0),
    ];
}


}
