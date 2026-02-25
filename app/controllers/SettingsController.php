<?php

require_once APP_BASE_PATH . '/app/models/SettingsModel.php';
require_once APP_BASE_PATH . '/app/auth/Auth.php';

class SettingsController
{
    /**
     * @var SettingsModel
     */
    private $settings;

    public function __construct(mysqli $db)
    {
        $this->settings = new SettingsModel($db);
    }

    public function show()
    {
        $this->requireSettingsAccess();

        $settings = $this->settings->get();
        $err = $this->settings->getLastError();
        if ($err !== '') {
            sendError('DB_ERROR', $err, 500);
        }

        $roles = $this->settings->getRoles();
        $workCategories = $this->settings->getWorkCategories();
        $projectStatuses = $this->settings->getProjectStatuses();

        sendJson([
            'success' => true,
            'data' => [
                'settings' => $settings,
                'roles' => $roles,
                'work_categories' => $workCategories,
                'project_statuses' => $projectStatuses
            ]
        ]);
    }

    public function save()
    {
        $this->requireSettingsAccess();

        $payload = getJsonPayload();
        $rolesPayload = (isset($payload['roles']) && is_array($payload['roles'])) ? $payload['roles'] : [];
        $workCategoriesPayload = (isset($payload['work_categories']) && is_array($payload['work_categories'])) ? $payload['work_categories'] : [];
        $projectStatusesPayload = (isset($payload['project_statuses']) && is_array($payload['project_statuses'])) ? $payload['project_statuses'] : [];

        $roles = [];
        $sort = 0;

        foreach ($rolesPayload as $r) {
            $name = isset($r['role_name']) ? trim((string) $r['role_name']) : '';
            $tag = isset($r['role_tag']) ? trim((string) $r['role_tag']) : '';

            if ($name === '' && $tag === '') {
                continue;
            }

            if ($name === '' || $tag === '') {
                sendError('VALIDATION_ERROR', 'Роль и тег роли должны быть заполнены.');
            }

            $tag = mb_strtolower($tag);

            if (!preg_match('/^[a-z0-9_-]+$/', $tag)) {
                sendError('VALIDATION_ERROR', 'Тег роли: только латиница, цифры, "_" и "-".');
            }

            $roles[] = [
                'role_name' => $name,
                'role_tag' => $tag,
                'sort_order' => $sort
            ];
            $sort++;
        }



        $workCategories = [];
        $workCategorySort = 0;

        foreach ($workCategoriesPayload as $c) {
            $name = isset($c['name']) ? trim((string) $c['name']) : '';
            $tag = isset($c['tag']) ? trim((string) $c['tag']) : '';

            if ($name === '' && $tag === '') {
                continue;
            }

            if ($name === '' || $tag === '') {
                sendError('VALIDATION_ERROR', 'Категория и тег категории должны быть заполнены.');
            }

            $tag = mb_strtolower($tag);

            if (!preg_match('/^[a-z0-9_-]+$/', $tag)) {
                sendError('VALIDATION_ERROR', 'Тег категории: только латиница, цифры, "_" и "-".');
            }

            $workCategories[] = [
                'name' => $name,
                'tag' => $tag,
                'sort_order' => $workCategorySort,
            ];
            $workCategorySort++;
        }

        $projectStatuses = [];
        $projectStatusSort = 0;
        foreach ($projectStatusesPayload as $s) {
            $name = isset($s['name']) ? trim((string)$s['name']) : '';
            $code = isset($s['code']) ? trim((string)$s['code']) : '';
            if ($name === '' && $code === '') {
                continue;
            }
            if ($name === '' || $code === '') {
                sendError('VALIDATION_ERROR', 'Статус проекта и код должны быть заполнены.');
            }
            $code = mb_strtolower($code);
            if (!preg_match('/^[a-z0-9_-]+$/', $code)) {
                sendError('VALIDATION_ERROR', 'Код статуса проекта: только латиница, цифры, "_" и "-".');
            }
            $projectStatuses[] = [
                'name' => $name,
                'code' => $code,
                'sort_order' => $projectStatusSort,
                'is_active' => 1
            ];
            $projectStatusSort++;
        }

        $hour = isset($payload['scheduler_start_hour']) ? (int) $payload['scheduler_start_hour'] : 9;
        if ($hour < 0 || $hour > 23) {
            sendError('VALIDATION_ERROR', 'Время начала отправки должно быть в диапазоне 0-23.');
        }

        if (isset($payload['finance_tbank_invoice_due_days'])) {
            $due = (int) $payload['finance_tbank_invoice_due_days'];
            if ($due < 0 || $due > 365) {
                sendError('VALIDATION_ERROR', 'finance_tbank_invoice_due_days: допустимо 0-365.');
            }
        }

        $financeTotalExpense = 0.0;
        if (isset($payload['finance_total_expense'])) {
            $expenseRaw = str_replace(',', '.', trim((string)$payload['finance_total_expense']));
            $financeTotalExpense = (float)$expenseRaw;
            if ($financeTotalExpense < 0) {
                sendError('VALIDATION_ERROR', 'Ежемесячные расходы не могут быть отрицательными.');
            }
        }

        $ok = $this->settings->save([
            'tinkoff_business_token' => (string) ($payload['tinkoff_business_token'] ?? ''),
            'dadata_token' => (string) ($payload['dadata_token'] ?? ''),
            'scheduler_start_hour' => $hour,

            'crm_public_url' => (string) ($payload['crm_public_url'] ?? ''),

            'finance_tbank_account_number' => (string) ($payload['finance_tbank_account_number'] ?? ''),
            'finance_tbank_invoice_due_days' => isset($payload['finance_tbank_invoice_due_days']) ? (int) $payload['finance_tbank_invoice_due_days'] : 3,
            'finance_tbank_unit_default' => (string) ($payload['finance_tbank_unit_default'] ?? 'Шт'),
            'finance_tbank_vat_default' => (string) ($payload['finance_tbank_vat_default'] ?? 'None'),
            'finance_tbank_payment_purpose_template' => (string) ($payload['finance_tbank_payment_purpose_template'] ?? ''),

            'finance_invoice_number_prefix' => (string) ($payload['finance_invoice_number_prefix'] ?? 'INV-'),
            'finance_act_number_prefix' => (string) ($payload['finance_act_number_prefix'] ?? 'ACT-'),
            'finance_total_expense' => (string)$financeTotalExpense,

            'finance_legal_name' => (string) ($payload['finance_legal_name'] ?? ''),
            'finance_legal_inn' => (string) ($payload['finance_legal_inn'] ?? ''),
            'finance_legal_kpp' => (string) ($payload['finance_legal_kpp'] ?? ''),
            'finance_legal_address' => (string) ($payload['finance_legal_address'] ?? ''),
            'finance_legal_bank_details' => (string) ($payload['finance_legal_bank_details'] ?? ''),

            'finance_email_from_email' => (string) ($payload['finance_email_from_email'] ?? ''),
            'finance_email_from_name' => (string) ($payload['finance_email_from_name'] ?? ''),
            'finance_email_subject_invoice' => (string) ($payload['finance_email_subject_invoice'] ?? ''),
            'finance_email_subject_act' => (string) ($payload['finance_email_subject_act'] ?? ''),
            'finance_email_body_invoice_html' => (string) ($payload['finance_email_body_invoice_html'] ?? ''),
            'finance_email_body_act_html' => (string) ($payload['finance_email_body_act_html'] ?? ''),
            'finance_email_bcc' => (string) ($payload['finance_email_bcc'] ?? ''),

            'finance_telegram_bot_token' => (string) ($payload['finance_telegram_bot_token'] ?? ''),
            'telegram_default_message_invoice' => (string) ($payload['telegram_default_message_invoice'] ?? ''),

            'finance_diadoc_api_client_id' => (string) ($payload['finance_diadoc_api_client_id'] ?? ''),
            'finance_diadoc_login' => (string) ($payload['finance_diadoc_login'] ?? ''),
            'finance_diadoc_password' => (string) ($payload['finance_diadoc_password'] ?? ''),
            'finance_diadoc_from_box_id' => (string) ($payload['finance_diadoc_from_box_id'] ?? ''),
        ]);

        if (!$ok) {
            $err = $this->settings->getLastError();
            if ($err === '') $err = 'Не удалось сохранить настройки';
            sendError('SERVER_ERROR', $err, 500);
        }

        $okRoles = $this->settings->replaceRoles($roles);
        if (!$okRoles) {
            sendError('SERVER_ERROR', 'Не удалось сохранить роли сотрудников', 500);
        }

        $okWorkCategories = $this->settings->replaceWorkCategories($workCategories);
        if (!$okWorkCategories) {
            sendError('SERVER_ERROR', 'Не удалось сохранить категории работ', 500);
        }
        $okProjectStatuses = $this->settings->replaceProjectStatuses($projectStatuses);
        if (!$okProjectStatuses) {
            sendError('SERVER_ERROR', 'Не удалось сохранить статусы проектов', 500);
        }

        $settings = $this->settings->get();
        $err = $this->settings->getLastError();
        if ($err !== '') {
            sendError('DB_ERROR', $err, 500);
        }

        sendJson([
            'success' => true,
            'data' => [
                'settings' => $settings,
                'roles' => $this->settings->getRoles(),
                'work_categories' => $this->settings->getWorkCategories(),
                'project_statuses' => $this->settings->getProjectStatuses()
            ]
        ]);
    }

    public function workCategoriesIndex()
    {
        $this->requireSettingsAccess();

        sendJson([
            'success' => true,
            'data' => [
                'work_categories' => $this->settings->getWorkCategories()
            ]
        ]);
    }

    public function workCategoriesStore()
    {
        $this->requireSettingsAccess();

        $payload = getJsonPayload();
        [$name, $tag, $sortOrder] = $this->normalizeWorkCategoryPayload($payload);

        if ($this->settings->workCategoryTagExists($tag)) {
            sendError('VALIDATION_ERROR', 'Тег уже используется.');
        }

        $id = $this->settings->createWorkCategory($name, $tag, $sortOrder);
        if ($id === null) {
            sendError('DB_ERROR', $this->settings->getLastError(), 500);
        }

        sendJson([
            'success' => true,
            'data' => [
                'id' => $id,
                'work_categories' => $this->settings->getWorkCategories()
            ]
        ]);
    }

    public function workCategoriesUpdate(int $id)
    {
        $this->requireSettingsAccess();

        $payload = getJsonPayload();
        [$name, $tag, $sortOrder] = $this->normalizeWorkCategoryPayload($payload);

        if ($this->settings->workCategoryTagExists($tag, $id)) {
            sendError('VALIDATION_ERROR', 'Тег уже используется.');
        }

        $ok = $this->settings->updateWorkCategory($id, $name, $tag, $sortOrder);
        if (!$ok) {
            sendError('DB_ERROR', $this->settings->getLastError(), 500);
        }

        sendJson([
            'success' => true,
            'data' => [
                'work_categories' => $this->settings->getWorkCategories()
            ]
        ]);
    }

    public function workCategoriesDelete(int $id)
    {
        $this->requireSettingsAccess();

        $ok = $this->settings->deleteWorkCategory($id);
        if (!$ok) {
            sendError('DB_ERROR', $this->settings->getLastError(), 500);
        }

        sendJson([
            'success' => true,
            'data' => [
                'work_categories' => $this->settings->getWorkCategories()
            ]
        ]);
    }

    private function requireSettingsAccess(): array
    {
        $user = Auth::requireAuth();
        $role = isset($user['role']) ? (string) $user['role'] : '';
        if ($role !== 'admin' && $role !== 'owner') {
            sendError('FORBIDDEN', 'Недостаточно прав', 403);
        }

        return $user;
    }

    private function normalizeWorkCategoryPayload(array $payload): array
    {
        $name = trim((string) ($payload['name'] ?? ''));
        $tag = mb_strtolower(trim((string) ($payload['tag'] ?? '')));
        $sortOrder = isset($payload['sort_order']) ? (int) $payload['sort_order'] : 100;

        if ($name === '') {
            sendError('VALIDATION_ERROR', 'Название категории обязательно.');
        }

        if ($tag === '') {
            sendError('VALIDATION_ERROR', 'Тег категории обязателен.');
        }

        if (!preg_match('/^[a-z0-9_-]+$/', $tag)) {
            sendError('VALIDATION_ERROR', 'Тег: только латиница, цифры, "_" и "-".');
        }

        return [$name, $tag, $sortOrder];
    }

}
