<?php

class SettingsModel
{
    /**
     * @var mysqli
     */
    private $db;

    /**
     * @var array|null
     */
    private $columnsCache = null;

    /**
     * @var string
     */
    private $lastError = '';

    public function __construct(mysqli $db)
    {
        $this->db = $db;
    }

    public function getLastError(): string
    {
        return $this->lastError;
    }

    private function setError(string $msg): void
    {
        $this->lastError = $msg;
    }

    private function ensureRow(): void
    {
        $ok = $this->db->query("INSERT INTO crm_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id");
        if (!$ok) {
            $this->setError('ensureRow failed: ' . $this->db->error);
        }
        $this->ensureFinanceColumns();
        $this->ensureNotificationTriggersTable();
    }

    private function ensureFinanceColumns(): void
    {
        try {
            $res = $this->db->query("SHOW COLUMNS FROM crm_settings LIKE 'finance_total_expense'");
            if ($res) {
                $exists = $res->num_rows > 0;
                $res->close();
                if (!$exists) {
                    $this->db->query("ALTER TABLE crm_settings ADD COLUMN finance_total_expense DECIMAL(12,2) NOT NULL DEFAULT 0");
                    $this->columnsCache = null;
                }
            }

            $res = $this->db->query("SHOW COLUMNS FROM crm_settings LIKE 'finance_email_subject_reminder'");
            if ($res) {
                $exists = $res->num_rows > 0;
                $res->close();
                if (!$exists) {
                    $this->db->query("ALTER TABLE crm_settings ADD COLUMN finance_email_subject_reminder VARCHAR(255) NULL AFTER finance_email_subject_act");
                    $this->columnsCache = null;
                }
            }

            $res = $this->db->query("SHOW COLUMNS FROM crm_settings LIKE 'finance_email_body_reminder_html'");
            if ($res) {
                $exists = $res->num_rows > 0;
                $res->close();
                if (!$exists) {
                    $this->db->query("ALTER TABLE crm_settings ADD COLUMN finance_email_body_reminder_html MEDIUMTEXT NULL AFTER finance_email_body_act_html");
                    $this->columnsCache = null;
                }
            }
        } catch (Throwable $e) {
            $this->setError('ensureFinanceColumns failed: ' . $e->getMessage());
        }
    }

    private function ensureNotificationTriggersTable(): void
    {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS notification_triggers (
                        id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
                        event_code VARCHAR(128) COLLATE utf8mb4_unicode_ci NOT NULL,
                        trigger_name VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
                        channel ENUM('email','telegram','webhook') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'telegram',
                        recipient VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
                        is_active TINYINT(1) NOT NULL DEFAULT 1,
                        sort_order INT(10) UNSIGNED NOT NULL DEFAULT 0,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        UNIQUE KEY uniq_trigger_event_channel_recipient (event_code, channel, recipient),
                        KEY idx_trigger_sort (sort_order, id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            $this->db->query($sql);

            $seed = "INSERT IGNORE INTO notification_triggers (event_code, trigger_name, channel, recipient, is_active, sort_order)
                     VALUES ('finance.unknown_payment.created', 'Появление новой неопознанной оплаты', 'telegram', '', 1, 0)";
            $this->db->query($seed);
        } catch (Throwable $e) {
            $this->setError('ensureNotificationTriggersTable failed: ' . $e->getMessage());
        }
    }

    /**
     * @return array<string,bool>
     */
    private function getAvailableColumns(): array
    {
        if ($this->columnsCache !== null) {
            return $this->columnsCache;
        }

        $map = [];
        $res = $this->db->query("SHOW COLUMNS FROM crm_settings");
        if (!$res) {
            $this->setError('SHOW COLUMNS failed: ' . $this->db->error);
            $this->columnsCache = [];
            return $this->columnsCache;
        }

        while ($row = $res->fetch_assoc()) {
            if (!empty($row['Field'])) {
                $map[(string) $row['Field']] = true;
            }
        }

        $this->columnsCache = $map;
        return $map;
    }

    /**
     * Если SHOW COLUMNS не сработал (cols пустой), читаем из $row напрямую.
     */
    private function col(array $row, array $cols, string $name, $default = '')
    {
        if (!empty($cols) && !isset($cols[$name])) {
            return $default;
        }
        return $row[$name] ?? $default;
    }

    public function get(): array
    {
        $this->lastError = '';
        $this->ensureRow();

        $cols = $this->getAvailableColumns();

        $res = $this->db->query("SELECT * FROM crm_settings WHERE id = 1 LIMIT 1");
        if (!$res) {
            $this->setError('SELECT crm_settings failed: ' . $this->db->error);
            return [];
        }

        $row = $res->fetch_assoc();
        if (!is_array($row)) {
            $this->setError('SELECT crm_settings returned empty row');
            return [];
        }

        return [
            'tinkoff_business_token' => (string) $this->col($row, $cols, 'tinkoff_business_token', ''),
            'dadata_token' => (string) $this->col($row, $cols, 'dadata_token', ''),
            'scheduler_start_hour' => (int) $this->col($row, $cols, 'scheduler_start_hour', 9),

            'crm_public_url' => (string) $this->col($row, $cols, 'crm_public_url', ''),
            'admin_email' => (string) $this->col($row, $cols, 'admin_email', ''),
            'admin_telegram_id' => (string) $this->col($row, $cols, 'admin_telegram_id', ''),

            'finance_invoice_number_prefix' => (string) $this->col($row, $cols, 'finance_invoice_number_prefix', 'INV-'),
            'finance_act_number_prefix' => (string) $this->col($row, $cols, 'finance_act_number_prefix', 'ACT-'),
            'finance_total_expense' => (float) $this->col($row, $cols, 'finance_total_expense', 0),

            'finance_legal_name' => (string) $this->col($row, $cols, 'finance_legal_name', ''),
            'finance_legal_inn' => (string) $this->col($row, $cols, 'finance_legal_inn', ''),
            'finance_legal_kpp' => (string) $this->col($row, $cols, 'finance_legal_kpp', ''),
            'finance_legal_address' => (string) $this->col($row, $cols, 'finance_legal_address', ''),
            'finance_legal_bank_details' => (string) $this->col($row, $cols, 'finance_legal_bank_details', ''),

            'finance_tbank_account_number' => (string) $this->col($row, $cols, 'finance_tbank_account_number', ''),
            'finance_tbank_invoice_due_days' => (int) $this->col($row, $cols, 'finance_tbank_invoice_due_days', 3),
            'finance_tbank_unit_default' => (string) $this->col($row, $cols, 'finance_tbank_unit_default', 'Шт'),
            'finance_tbank_vat_default' => (string) $this->col($row, $cols, 'finance_tbank_vat_default', 'None'),
            'finance_tbank_payment_purpose_template' => (string) $this->col($row, $cols, 'finance_tbank_payment_purpose_template', ''),

            'finance_email_from_email' => (string) $this->col($row, $cols, 'finance_email_from_email', ''),
            'finance_email_from_name' => (string) $this->col($row, $cols, 'finance_email_from_name', ''),
            'finance_email_subject_invoice' => (string) $this->col($row, $cols, 'finance_email_subject_invoice', ''),
            'finance_email_subject_act' => (string) $this->col($row, $cols, 'finance_email_subject_act', ''),
            'finance_email_subject_reminder' => (string) $this->col($row, $cols, 'finance_email_subject_reminder', ''),
            'finance_email_body_invoice_html' => (string) $this->col($row, $cols, 'finance_email_body_invoice_html', ''),
            'finance_email_body_act_html' => (string) $this->col($row, $cols, 'finance_email_body_act_html', ''),
            'finance_email_body_reminder_html' => (string) $this->col($row, $cols, 'finance_email_body_reminder_html', ''),
            'finance_email_bcc' => (string) $this->col($row, $cols, 'finance_email_bcc', ''),

            'finance_telegram_bot_token' => (string) $this->col($row, $cols, 'finance_telegram_bot_token', ''),
            'telegram_default_message_invoice' => (string) $this->col($row, $cols, 'telegram_default_message_invoice', ''),

            'finance_diadoc_api_client_id' => (string) $this->col($row, $cols, 'finance_diadoc_api_client_id', ''),
            'finance_diadoc_login' => (string) $this->col($row, $cols, 'finance_diadoc_login', ''),
            'finance_diadoc_password' => (string) $this->col($row, $cols, 'finance_diadoc_password', ''),
            'finance_diadoc_from_box_id' => (string) $this->col($row, $cols, 'finance_diadoc_from_box_id', ''),
        ];
    }

    public function save(array $data): bool
    {
        $this->lastError = '';
        $this->ensureRow();

        $cols = $this->getAvailableColumns();
        $skipColCheck = empty($cols);

        $map = [
            'tinkoff_business_token' => ['col' => 'tinkoff_business_token', 'type' => 's'],
            'dadata_token' => ['col' => 'dadata_token', 'type' => 's'],
            'scheduler_start_hour' => ['col' => 'scheduler_start_hour', 'type' => 'i'],

            'crm_public_url' => ['col' => 'crm_public_url', 'type' => 's'],
            'admin_email' => ['col' => 'admin_email', 'type' => 's'],
            'admin_telegram_id' => ['col' => 'admin_telegram_id', 'type' => 's'],

            'finance_invoice_number_prefix' => ['col' => 'finance_invoice_number_prefix', 'type' => 's'],
            'finance_act_number_prefix' => ['col' => 'finance_act_number_prefix', 'type' => 's'],
            'finance_total_expense' => ['col' => 'finance_total_expense', 'type' => 's'],

            'finance_legal_name' => ['col' => 'finance_legal_name', 'type' => 's'],
            'finance_legal_inn' => ['col' => 'finance_legal_inn', 'type' => 's'],
            'finance_legal_kpp' => ['col' => 'finance_legal_kpp', 'type' => 's'],
            'finance_legal_address' => ['col' => 'finance_legal_address', 'type' => 's'],
            'finance_legal_bank_details' => ['col' => 'finance_legal_bank_details', 'type' => 's'],

            'finance_tbank_account_number' => ['col' => 'finance_tbank_account_number', 'type' => 's'],
            'finance_tbank_invoice_due_days' => ['col' => 'finance_tbank_invoice_due_days', 'type' => 'i'],
            'finance_tbank_unit_default' => ['col' => 'finance_tbank_unit_default', 'type' => 's'],
            'finance_tbank_vat_default' => ['col' => 'finance_tbank_vat_default', 'type' => 's'],
            'finance_tbank_payment_purpose_template' => ['col' => 'finance_tbank_payment_purpose_template', 'type' => 's'],

            'finance_email_from_email' => ['col' => 'finance_email_from_email', 'type' => 's'],
            'finance_email_from_name' => ['col' => 'finance_email_from_name', 'type' => 's'],
            'finance_email_subject_invoice' => ['col' => 'finance_email_subject_invoice', 'type' => 's'],
            'finance_email_subject_act' => ['col' => 'finance_email_subject_act', 'type' => 's'],
            'finance_email_subject_reminder' => ['col' => 'finance_email_subject_reminder', 'type' => 's'],
            'finance_email_body_invoice_html' => ['col' => 'finance_email_body_invoice_html', 'type' => 's'],
            'finance_email_body_act_html' => ['col' => 'finance_email_body_act_html', 'type' => 's'],
            'finance_email_body_reminder_html' => ['col' => 'finance_email_body_reminder_html', 'type' => 's'],
            'finance_email_bcc' => ['col' => 'finance_email_bcc', 'type' => 's'],

            'finance_telegram_bot_token' => ['col' => 'finance_telegram_bot_token', 'type' => 's'],
            'telegram_default_message_invoice' => ['col' => 'telegram_default_message_invoice', 'type' => 's'],

            'finance_diadoc_api_client_id' => ['col' => 'finance_diadoc_api_client_id', 'type' => 's'],
            'finance_diadoc_login' => ['col' => 'finance_diadoc_login', 'type' => 's'],
            'finance_diadoc_password' => ['col' => 'finance_diadoc_password', 'type' => 's'],
            'finance_diadoc_from_box_id' => ['col' => 'finance_diadoc_from_box_id', 'type' => 's'],
        ];

        $setParts = [];
        $types = '';
        $values = [];

        foreach ($map as $key => $meta) {
            if (!array_key_exists($key, $data)) {
                continue;
            }

            $col = $meta['col'];

            if (!$skipColCheck && !isset($cols[$col])) {
                continue;
            }

            $setParts[] = $col . " = ?";
            $types .= $meta['type'];

            if ($meta['type'] === 'i') {
                $values[] = (int) $data[$key];
            } else {
                $values[] = (string) $data[$key];
            }
        }

        if (empty($setParts)) {
            $this->setError('No columns selected for UPDATE. SHOW COLUMNS may be failing.');
            return false;
        }

        $sql = "UPDATE crm_settings SET " . implode(",\n", $setParts) . " WHERE id = 1";
        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            $this->setError('Prepare failed: ' . $this->db->error);
            return false;
        }

        $okBind = $this->bindParams($stmt, $types, $values);
        if (!$okBind) {
            $this->setError('Bind failed');
            $stmt->close();
            return false;
        }

        $ok = $stmt->execute();
        if (!$ok) {
            $this->setError('Execute failed: ' . $stmt->error);
        }

        $stmt->close();
        return (bool) $ok;
    }

    private function bindParams(mysqli_stmt $stmt, string $types, array &$values): bool
    {
        $refs = [];
        foreach ($values as $k => &$v) {
            $refs[$k] = &$v;
        }
        array_unshift($refs, $types);

        return (bool) call_user_func_array([$stmt, 'bind_param'], $refs);
    }

    public function getRoles(): array
    {
        $res = $this->db->query(
            "SELECT id, role_name, role_tag, sort_order
             FROM crm_employee_roles
             ORDER BY id ASC"
        );

        $out = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $out[] = [
                    'id' => (int) $row['id'],
                    'role_name' => (string) $row['role_name'],
                    'role_tag' => (string) $row['role_tag'],
                    'sort_order' => (int) $row['sort_order'],
                ];
            }
        }

        return $out;
    }

    public function replaceRoles(array $roles): bool
    {
        $this->db->begin_transaction();

        try {
            $ok = $this->db->query("DELETE FROM crm_employee_roles");
            if (!$ok) {
                throw new Exception('delete failed');
            }

            if (!empty($roles)) {
                $stmt = $this->db->prepare(
                    "INSERT INTO crm_employee_roles (role_name, role_tag, sort_order)
                     VALUES (?, ?, ?)"
                );
                if (!$stmt) {
                    throw new Exception('prepare failed');
                }

                foreach ($roles as $r) {
                    $name = isset($r['role_name']) ? trim((string) $r['role_name']) : '';
                    $tag = isset($r['role_tag']) ? trim((string) $r['role_tag']) : '';
                    $sort = isset($r['sort_order']) ? (int) $r['sort_order'] : 0;

                    $stmt->bind_param('ssi', $name, $tag, $sort);
                    if (!$stmt->execute()) {
                        $stmt->close();
                        throw new Exception('execute failed');
                    }
                }

                $stmt->close();
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollback();
            return false;
        }
    }

    public function getWorkCategories(): array
    {
        $res = $this->db->query(
            "SELECT id, name, tag, sort_order
             FROM work_categories
             ORDER BY id ASC"
        );

        $out = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $out[] = [
                    'id' => (int) $row['id'],
                    'name' => (string) $row['name'],
                    'tag' => (string) $row['tag'],
                    'sort_order' => (int) $row['sort_order'],
                ];
            }
        }

        return $out;
    }

    public function createWorkCategory(string $name, string $tag, int $sortOrder): ?int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO work_categories (name, tag, sort_order) VALUES (?, ?, ?)"
        );

        if (!$stmt) {
            $this->setError('Prepare createWorkCategory failed: ' . $this->db->error);
            return null;
        }

        $stmt->bind_param('ssi', $name, $tag, $sortOrder);
        $ok = $stmt->execute();
        if (!$ok) {
            $this->setError('Execute createWorkCategory failed: ' . $stmt->error);
            $stmt->close();
            return null;
        }

        $id = (int) $stmt->insert_id;
        $stmt->close();
        return $id;
    }

    public function updateWorkCategory(int $id, string $name, string $tag, int $sortOrder): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE work_categories
             SET name = ?, tag = ?, sort_order = ?
             WHERE id = ?"
        );

        if (!$stmt) {
            $this->setError('Prepare updateWorkCategory failed: ' . $this->db->error);
            return false;
        }

        $stmt->bind_param('ssii', $name, $tag, $sortOrder, $id);
        $ok = $stmt->execute();
        if (!$ok) {
            $this->setError('Execute updateWorkCategory failed: ' . $stmt->error);
            $stmt->close();
            return false;
        }

        $stmt->close();
        return true;
    }

    public function deleteWorkCategory(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM work_categories WHERE id = ?");
        if (!$stmt) {
            $this->setError('Prepare deleteWorkCategory failed: ' . $this->db->error);
            return false;
        }

        $stmt->bind_param('i', $id);
        $ok = $stmt->execute();
        if (!$ok) {
            $this->setError('Execute deleteWorkCategory failed: ' . $stmt->error);
            $stmt->close();
            return false;
        }

        $stmt->close();
        return true;
    }

    public function workCategoryTagExists(string $tag, ?int $excludeId = null): bool
    {
        if ($excludeId !== null) {
            $stmt = $this->db->prepare("SELECT id FROM work_categories WHERE tag = ? AND id <> ? LIMIT 1");
            if (!$stmt) {
                $this->setError('Prepare workCategoryTagExists failed: ' . $this->db->error);
                return true;
            }
            $stmt->bind_param('si', $tag, $excludeId);
        } else {
            $stmt = $this->db->prepare("SELECT id FROM work_categories WHERE tag = ? LIMIT 1");
            if (!$stmt) {
                $this->setError('Prepare workCategoryTagExists failed: ' . $this->db->error);
                return true;
            }
            $stmt->bind_param('s', $tag);
        }

        $ok = $stmt->execute();
        if (!$ok) {
            $this->setError('Execute workCategoryTagExists failed: ' . $stmt->error);
            $stmt->close();
            return true;
        }

        $res = $stmt->get_result();
        $exists = $res && $res->num_rows > 0;
        $stmt->close();

        return $exists;
    }


    public function replaceWorkCategories(array $categories): bool
    {
        $this->db->begin_transaction();

        try {
            $ok = $this->db->query("DELETE FROM work_categories");
            if (!$ok) {
                throw new Exception('delete failed');
            }

            if (!empty($categories)) {
                $stmt = $this->db->prepare(
                    "INSERT INTO work_categories (name, tag, sort_order)
                     VALUES (?, ?, ?)"
                );
                if (!$stmt) {
                    throw new Exception('prepare failed');
                }

                foreach ($categories as $c) {
                    $name = isset($c['name']) ? trim((string) $c['name']) : '';
                    $tag = isset($c['tag']) ? trim((string) $c['tag']) : '';
                    $sort = isset($c['sort_order']) ? (int) $c['sort_order'] : 0;
                    $stmt->bind_param('ssi', $name, $tag, $sort);
                    if (!$stmt->execute()) {
                        $stmt->close();
                        throw new Exception('execute failed');
                    }
                }

                $stmt->close();
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollback();
            return false;
        }
    }

    public function getProjectStatuses(): array
    {
        $res = $this->db->query(
            "SELECT id, code, name, sort_order, is_active
             FROM finance_project_statuses
             ORDER BY sort_order ASC, id ASC"
        );

        if ($res === false) {
            if ((int)$this->db->errno === 1146) {
                return [];
            }
            return [];
        }

        $out = [];
        while ($row = $res->fetch_assoc()) {
            $out[] = [
                'id' => (int)$row['id'],
                'code' => (string)$row['code'],
                'name' => (string)$row['name'],
                'sort_order' => (int)$row['sort_order'],
                'is_active' => (int)$row['is_active'],
            ];
        }
        $res->close();

        return $out;
    }

    public function replaceProjectStatuses(array $statuses): bool
    {
        $check = $this->db->query("SELECT 1 FROM finance_project_statuses LIMIT 1");
        if ($check === false && (int)$this->db->errno === 1146) {
            return true;
        }
        if ($check instanceof mysqli_result) {
            $check->close();
        }

        $this->db->begin_transaction();

        try {
            $ok = $this->db->query("DELETE FROM finance_project_statuses");
            if (!$ok) {
                throw new Exception('delete failed');
            }

            if (!empty($statuses)) {
                $stmt = $this->db->prepare(
                    "INSERT INTO finance_project_statuses (code, name, sort_order, is_active)
                     VALUES (?, ?, ?, ?)"
                );
                if (!$stmt) {
                    throw new Exception('prepare failed');
                }

                foreach ($statuses as $s) {
                    $code = isset($s['code']) ? trim((string)$s['code']) : '';
                    $name = isset($s['name']) ? trim((string)$s['name']) : '';
                    $sort = isset($s['sort_order']) ? (int)$s['sort_order'] : 0;
                    $active = isset($s['is_active']) ? (int)$s['is_active'] : 1;

                    $stmt->bind_param('ssii', $code, $name, $sort, $active);
                    if (!$stmt->execute()) {
                        $stmt->close();
                        throw new Exception('execute failed');
                    }
                }

                $stmt->close();
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollback();
            return false;
        }
    }

    public function getNotificationTriggers(): array
    {
        $this->ensureNotificationTriggersTable();

        $res = $this->db->query(
            "SELECT id, event_code, trigger_name, channel, recipient, is_active, sort_order
             FROM notification_triggers
             ORDER BY sort_order ASC, id ASC"
        );

        if ($res === false) {
            return [];
        }

        $out = [];
        while ($row = $res->fetch_assoc()) {
            $out[] = [
                'id' => (int)$row['id'],
                'event_code' => (string)$row['event_code'],
                'trigger_name' => (string)$row['trigger_name'],
                'channel' => (string)$row['channel'],
                'recipient' => (string)$row['recipient'],
                'is_active' => (int)$row['is_active'],
                'sort_order' => (int)$row['sort_order'],
            ];
        }
        $res->close();

        return $out;
    }

    public function replaceNotificationTriggers(array $triggers): bool
    {
        $this->ensureNotificationTriggersTable();
        $this->db->begin_transaction();

        try {
            $ok = $this->db->query("DELETE FROM notification_triggers");
            if (!$ok) {
                throw new Exception('delete failed');
            }

            if (!empty($triggers)) {
                $stmt = $this->db->prepare(
                    "INSERT INTO notification_triggers (event_code, trigger_name, channel, recipient, is_active, sort_order)
                     VALUES (?, ?, ?, ?, ?, ?)"
                );
                if (!$stmt) {
                    throw new Exception('prepare failed');
                }

                foreach ($triggers as $t) {
                    $eventCode = isset($t['event_code']) ? trim((string)$t['event_code']) : '';
                    $triggerName = isset($t['trigger_name']) ? trim((string)$t['trigger_name']) : '';
                    $channel = isset($t['channel']) ? trim((string)$t['channel']) : 'telegram';
                    $recipient = isset($t['recipient']) ? trim((string)$t['recipient']) : '';
                    $isActive = isset($t['is_active']) ? (int)$t['is_active'] : 1;
                    $sortOrder = isset($t['sort_order']) ? (int)$t['sort_order'] : 0;

                    $stmt->bind_param('ssssii', $eventCode, $triggerName, $channel, $recipient, $isActive, $sortOrder);
                    if (!$stmt->execute()) {
                        $stmt->close();
                        throw new Exception('execute failed');
                    }
                }

                $stmt->close();
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollback();
            return false;
        }
    }

}
