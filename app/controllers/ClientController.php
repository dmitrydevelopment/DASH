<?php

require_once APP_BASE_PATH . '/app/models/ClientModel.php';
require_once APP_BASE_PATH . '/app/auth/Auth.php';

class ClientController
{
    /**
     * @var mysqli
     */
    private $db;

    /**
     * @var ClientModel
     */
    private $clients;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
        $this->clients = new ClientModel($db);
    }

    private function normalizeClientRow(array $row): array
    {
        return [
            'id'                 => (int)$row['id'],
            'name'               => $row['name'],
            'legal_name' => $row['legal_name'],
'inn'        => $row['inn'],
'kpp'        => $row['kpp'],
            'diadoc_box_id'      => $row['diadoc_box_id'] ?? null,
            'diadoc_department_id' => $row['diadoc_department_id'] ?? null,
            'contact_person'     => $row['contact_person'],

            'email'              => $row['email'],
            'additional_email'   => $row['additional_email'],

            'phone'              => $row['phone'],
            'industry'           => $row['industry'],
            'website'            => $row['website'],

            'manager_employee_id'=> $row['manager_employee_id'] !== null ? (int)$row['manager_employee_id'] : null,
            'manager_full_name'  => $row['manager_full_name'] ?? null,

            'tracker_project_id' => (int)$row['tracker_project_id'],
            'client_type' => $row['client_type'],
'send_invoice_schedule' => (int)$row['send_invoice_schedule'],
'invoice_use_end_month_date' => (int)$row['invoice_use_end_month_date'],
'send_invoice_telegram' => (int)$row['send_invoice_telegram'],
'send_invoice_diadoc' => (int)$row['send_invoice_diadoc'],
'send_act_diadoc' => (int)$row['send_act_diadoc'],
            'telegram_id'        => $row['telegram_id'],
            'chat_id'            => $row['chat_id'],

            'notes'              => $row['notes'],
            'is_active'          => (int)$row['is_active'],

            'created_at'         => $row['created_at'],
            'updated_at'         => $row['updated_at'],
        ];
    }

    public function index()
    {
        Auth::requireAuth();

        $items = $this->clients->getAll();
        $normalized = array_map(function ($row) {
            return $this->normalizeClientRow($row);
        }, $items);

        sendJson([
            'success' => true,
            'data' => [
                'clients' => $normalized
            ]
        ]);
    }

    public function store()
    {
        Auth::requireRole('admin');

        $payload = getJsonPayload();

        $name = isset($payload['name']) ? trim((string)$payload['name']) : '';
        $contact = isset($payload['contact_person']) ? trim((string)$payload['contact_person']) : '';

        if ($name === '' || $contact === '') {
            sendError('VALIDATION_ERROR', 'Заполните обязательные поля: Название компании, Контактное лицо.');
        }

        $data = [
            'name'               => $name,
            'legal_name' => $payload['legal_name'] ?? null,
'inn'        => $payload['inn'] ?? null,
'kpp'        => $payload['kpp'] ?? null,
            'diadoc_box_id'      => $payload['diadoc_box_id'] ?? null,
            'diadoc_department_id' => $payload['diadoc_department_id'] ?? null,
            'contact_person'     => $contact,

            'email'              => $payload['email'] ?? null,
            'additional_email'   => $payload['additional_email'] ?? null,

            'phone'              => $payload['phone'] ?? null,
            'industry'           => $payload['industry'] ?? null,
            'website'            => $payload['website'] ?? null,

            'manager_employee_id'=> isset($payload['manager_employee_id']) ? (int)$payload['manager_employee_id'] : 0,
            'tracker_project_id' => isset($payload['tracker_project_id']) ? (int)$payload['tracker_project_id'] : 0,
            'client_type' => $payload['client_type'] ?? 'support',
            'send_invoice_schedule' => !empty($payload['send_invoice_schedule']) ? 1 : 0,
'invoice_use_end_month_date' => !empty($payload['invoice_use_end_month_date']) ? 1 : 0,
'send_invoice_telegram' => !empty($payload['send_invoice_telegram']) ? 1 : 0,
'send_invoice_diadoc' => !empty($payload['send_invoice_diadoc']) ? 1 : 0,
'send_act_diadoc' => !empty($payload['send_act_diadoc']) ? 1 : 0,

            'telegram_id'        => $payload['telegram_id'] ?? null,
            'chat_id'            => $payload['chat_id'] ?? null,

            'notes'              => $payload['notes'] ?? null,
            'is_active'          => array_key_exists('is_active', $payload) ? (int)!empty($payload['is_active']) : 1,
        ];

        $id = $this->clients->create($data);
        if (!$id) {
            sendError('SERVER_ERROR', 'Не удалось создать клиента', 500);
        }

        $row = $this->clients->getById($id);
        if (!$row) {
            sendError('SERVER_ERROR', 'Не удалось загрузить клиента после создания', 500);
        }

        $invoiceItems = (isset($payload['invoice_items']) && is_array($payload['invoice_items'])) ? $payload['invoice_items'] : [];
$actItems = (isset($payload['act_items']) && is_array($payload['act_items'])) ? $payload['act_items'] : [];

$okInv = $this->clients->replaceInvoiceItems($id, $invoiceItems);
$okAct = $this->clients->replaceActItems($id, $actItems);
if (!$okInv || !$okAct) {
    sendError('SERVER_ERROR', 'Не удалось сохранить строки счетов или актов', 500);
}

$client = $this->normalizeClientRow($row);
$client['invoice_items'] = $this->clients->getInvoiceItems((int)$row['id']);
$client['act_items'] = $this->clients->getActItems((int)$row['id']);

        sendJson([
            'success' => true,
            'data' => [
                'client' => $this->normalizeClientRow($row)
            ]
        ]);
    }

    public function update(int $id)
    {
        Auth::requireRole('admin');

        $payload = getJsonPayload();

        $name = isset($payload['name']) ? trim((string)$payload['name']) : '';
        $contact = isset($payload['contact_person']) ? trim((string)$payload['contact_person']) : '';

        if ($name === '' || $contact === '') {
            sendError('VALIDATION_ERROR', 'Заполните обязательные поля: Название компании, Контактное лицо.');
        }

 $data = [
    'name'               => $name,
    'legal_name'         => $payload['legal_name'] ?? null,
    'inn'                => $payload['inn'] ?? null,
    'kpp'                => $payload['kpp'] ?? null,
    'diadoc_box_id'        => $payload['diadoc_box_id'] ?? null,
    'diadoc_department_id' => $payload['diadoc_department_id'] ?? null,
    'contact_person'     => $contact,

    'email'              => $payload['email'] ?? null,
    'additional_email'   => $payload['additional_email'] ?? null,

    'phone'              => $payload['phone'] ?? null,
    'industry'           => $payload['industry'] ?? null,
    'website'            => $payload['website'] ?? null,

    'manager_employee_id'=> isset($payload['manager_employee_id']) ? (int)$payload['manager_employee_id'] : 0,
    'tracker_project_id' => isset($payload['tracker_project_id']) ? (int)$payload['tracker_project_id'] : 0,
    'client_type'        => $payload['client_type'] ?? 'support',

    'send_invoice_schedule'        => !empty($payload['send_invoice_schedule']) ? 1 : 0,
    'invoice_use_end_month_date'   => !empty($payload['invoice_use_end_month_date']) ? 1 : 0,
    'send_invoice_telegram'        => !empty($payload['send_invoice_telegram']) ? 1 : 0,
    'send_invoice_diadoc'          => !empty($payload['send_invoice_diadoc']) ? 1 : 0,
    'send_act_diadoc'              => !empty($payload['send_act_diadoc']) ? 1 : 0,

    'telegram_id'        => $payload['telegram_id'] ?? null,
    'chat_id'            => $payload['chat_id'] ?? null,

    'notes'              => $payload['notes'] ?? null,
    'is_active'          => array_key_exists('is_active', $payload) ? (int)!empty($payload['is_active']) : 1,
];


        $ok = $this->clients->update($id, $data);
        $invoiceItems = (isset($payload['invoice_items']) && is_array($payload['invoice_items'])) ? $payload['invoice_items'] : [];
$actItems = (isset($payload['act_items']) && is_array($payload['act_items'])) ? $payload['act_items'] : [];

$okInv = $this->clients->replaceInvoiceItems($id, $invoiceItems);
$okAct = $this->clients->replaceActItems($id, $actItems);
if (!$okInv || !$okAct) {
    sendError('SERVER_ERROR', 'Не удалось сохранить строки счетов или актов', 500);
}
        if (!$ok) {
            sendError('SERVER_ERROR', 'Не удалось обновить клиента', 500);
        }

        $row = $this->clients->getById($id);
        if (!$row) {
            sendError('SERVER_ERROR', 'Не удалось загрузить клиента после обновления', 500);
        }
        $client = $this->normalizeClientRow($row);
$client['invoice_items'] = $this->clients->getInvoiceItems((int)$row['id']);
$client['act_items'] = $this->clients->getActItems((int)$row['id']);

sendJson([
    'success' => true,
    'data' => [
        'client' => $client
    ]
]);
    }

public function delete(int $id)
{
    Auth::requireRole('admin');

    $ok = $this->clients->delete($id);
    if (!$ok) {
        sendError('SERVER_ERROR', 'Не удалось удалить клиента', 500);
    }

    sendJson(['success' => true]);
}

public function stats()
{
    Auth::requireAuth();

    $stats = $this->clients->getStats();

    sendJson([
        'success' => true,
        'data' => [
            'stats' => $stats
        ]
    ]);
}

public function show(int $id)
{
    Auth::requireAuth();

    $row = $this->clients->getById($id);
    if (!$row) {
        sendError('NOT_FOUND', 'Клиент не найден', 404);
    }

    $client = $this->normalizeClientRow($row);
    $client['invoice_items'] = $this->clients->getInvoiceItems($id);
    $client['act_items'] = $this->clients->getActItems($id);

    sendJson([
        'success' => true,
        'data' => [
            'client' => $client
        ]
    ]);
}

}
