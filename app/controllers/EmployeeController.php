<?php

require_once APP_BASE_PATH . '/app/models/EmployeeModel.php';
require_once APP_BASE_PATH . '/app/auth/Auth.php';

class EmployeeController
{
    /**
     * @var mysqli
     */
    private $db;

    /**
     * @var EmployeeModel
     */
    private $employees;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
        $this->employees = new EmployeeModel($db);
    }

    /**
     * Нормализация одной записи сотрудника в формат API.
     *
     * Приводим расписание к виду:
     * schedule[weekday] = ['enabled' => bool, 'from_hour' => int|null, 'to_hour' => int|null]
     */
    private function normalizeEmployeeRow(array $row): array
    {
        $skills = [];
        if (!empty($row['skills_raw'])) {
            $skills = array_filter(array_map('trim', explode(',', $row['skills_raw'])));
        }

        $schedule = [];
        if (!empty($row['schedule']) && is_array($row['schedule'])) {
            foreach ($row['schedule'] as $weekday => $info) {
                if (!is_array($info)) {
                    continue;
                }

                $weekdayInt = (int) $weekday;

                // Поддерживаем оба варианта: is_working/hour_from/hour_to и enabled/from_hour/to_hour
                if (array_key_exists('enabled', $info)) {
                    $enabled = !empty($info['enabled']);
                    $fromHour = isset($info['from_hour']) ? (int) $info['from_hour'] : null;
                    $toHour   = isset($info['to_hour']) ? (int) $info['to_hour'] : null;
                } else {
                    $enabled = !empty($info['is_working']);
                    $fromHour = isset($info['hour_from']) ? (int) $info['hour_from'] : null;
                    $toHour   = isset($info['hour_to']) ? (int) $info['hour_to'] : null;
                }

                $schedule[$weekdayInt] = [
                    'enabled'   => $enabled,
                    'from_hour' => $fromHour,
                    'to_hour'   => $toHour,
                ];
            }
        }
        $salaryHistory = $this->employees->getSalaryHistoryLast((int)$row['id'], 50);

        return [
            'id'             => (int) $row['id'],
            'full_name'      => $row['full_name'],
            'position'       => $row['position'],
            'email'          => $row['email'],
            'phone'          => $row['phone'],
            'employee_type'  => $row['employee_type'],
            'user_id'        => $row['user_id'] !== null ? (int) $row['user_id'] : null,
            'telegram_id'    => $row['telegram_id'],
             'avatar_path' => $row['avatar_path'] ?? null,
    'avatar_url'  => !empty($row['avatar_path']) ? $row['avatar_path'] : null,
            'is_default'     => (int) $row['is_default'],
            'is_on_vacation' => (int) $row['is_on_vacation'],
            'is_active'      => (int) $row['is_active'],
            'salary_monthly' => (int) $row['salary_monthly'],
            'start_date'     => $row['start_date'],
            'skills'         => $skills,
            'schedule'       => $schedule,
            'salary_history' => $salaryHistory,
        ];
    }

    /**
     * GET /api.php/employees
     */
    public function index()
    {
        Auth::requireAuth();

        $items = $this->employees->getAll();

        $normalized = array_map(function (array $row) {
            return $this->normalizeEmployeeRow($row);
        }, $items);

        sendJson([
            'success' => true,
            'data'    => [
                'employees' => $normalized,
            ],
        ]);
    }

    /**
     * POST /api.php/employees
     * Создание сотрудника.
     */
    public function store()
    {
        Auth::requireRole('admin');

        $payload = getJsonPayload();

        if (empty($payload['full_name']) || empty($payload['position']) || empty($payload['email']) || empty($payload['phone'])) {
            sendError('VALIDATION_ERROR', 'Заполните обязательные поля: ФИО, должность, email, телефон.');
        }

        $data = [
            'full_name'      => $payload['full_name'],
            'position'       => $payload['position'],
            'email'          => $payload['email'],
            'phone'          => $payload['phone'],
            'employee_type'  => $payload['employee_type'] ?? null,
            'telegram_id'    => $payload['telegram_id'] ?? null,
            'is_default'     => !empty($payload['is_default']),
            'is_on_vacation' => !empty($payload['is_on_vacation']),
            'salary_monthly' => isset($payload['salary_monthly']) ? (int) $payload['salary_monthly'] : 0,
            'start_date'     => !empty($payload['start_date']) ? $payload['start_date'] : null,
            'skills_raw'     => isset($payload['skills']) && is_array($payload['skills'])
                ? implode(', ', $payload['skills'])
                : (isset($payload['skills_raw']) ? $payload['skills_raw'] : null),
            'schedule'       => isset($payload['schedule']) && is_array($payload['schedule'])
                ? $payload['schedule']
                : [],
        ];

        $id = $this->employees->create($data);
        if (!$id) {
            sendError('SERVER_ERROR', 'Не удалось создать сотрудника');
        }

        $employeeRow = $this->employees->getById($id);
        if (!$employeeRow) {
            sendError('SERVER_ERROR', 'Не удалось загрузить данные сотрудника после создания');
        }

        $employee = $this->normalizeEmployeeRow($employeeRow);

        sendJson([
            'success' => true,
            'data'    => [
                'employee' => $employee,
            ],
        ]);
    }

    /**
     * POST/PUT/PATCH /api.php/employees/{id}
     * Обновление сотрудника.
     */
    public function update($id)
    {
        Auth::requireRole('admin');

        $payload = getJsonPayload();

        $data = [
            'full_name'      => $payload['full_name'] ?? '',
            'position'       => $payload['position'] ?? '',
            'email'          => $payload['email'] ?? '',
            'phone'          => $payload['phone'] ?? '',
            'employee_type'  => $payload['employee_type'] ?? '',
            'telegram_id'    => $payload['telegram_id'] ?? '',
            'is_default'     => !empty($payload['is_default']),
            'is_on_vacation' => !empty($payload['is_on_vacation']),
            'salary_monthly' => isset($payload['salary_monthly']) ? (int) $payload['salary_monthly'] : 0,
            'start_date'     => !empty($payload['start_date']) ? $payload['start_date'] : null,
            'skills_raw'     => isset($payload['skills']) && is_array($payload['skills'])
                ? implode(', ', $payload['skills'])
                : (isset($payload['skills_raw']) ? $payload['skills_raw'] : null),
        ];

        // ВАЖНО: расписание меняем только если оно явно пришло в payload
        if (isset($payload['schedule']) && is_array($payload['schedule'])) {
            $data['schedule'] = $payload['schedule'];
        }

        $id = (int) $id;
        $ok = $this->employees->update($id, $data);

        if (!$ok) {
            sendError('SERVER_ERROR', 'Не удалось обновить сотрудника');
        }

        $employeeRow = $this->employees->getById($id);
        if (!$employeeRow) {
            sendError('SERVER_ERROR', 'Не удалось загрузить данные сотрудника после обновления');
        }

        $employee = $this->normalizeEmployeeRow($employeeRow);

        sendJson([
            'success' => true,
            'data'    => [
                'employee' => $employee,
            ],
        ]);
    }

    /**
     * DELETE /api.php/employees/{id}
     */
    public function delete($id)
    {
        Auth::requireRole('admin');

        $id = (int) $id;
        $ok = $this->employees->delete($id);

        if (!$ok) {
            sendError('SERVER_ERROR', 'Не удалось удалить сотрудника');
        }

        sendJson([
            'success' => true,
        ]);
    }

    /**
     * POST /api.php/employees/{id}/schedule
     * Сохранение расписания.
     */
    public function saveSchedule($id)
    {
        Auth::requireRole('admin');

        $payload = getJsonPayload();
        $schedule = isset($payload['schedule']) && is_array($payload['schedule'])
            ? $payload['schedule']
            : [];

        $id = (int) $id;

        $this->employees->saveSchedule($id, $schedule);

        // Можно вернуть обновленного сотрудника (на фронте это сейчас не используется, но на будущее удобно)
        $employeeRow = $this->employees->getById($id);
        $employee = $employeeRow ? $this->normalizeEmployeeRow($employeeRow) : null;

        sendJson([
            'success' => true,
            'data'    => [
                'employee' => $employee,
            ],
        ]);
    }

    public function uploadAvatar($id)
{
    Auth::requireRole('admin');

    $id = (int) $id;

    if (empty($_FILES['avatar']) || !is_array($_FILES['avatar'])) {
        sendError('VALIDATION_ERROR', 'Файл avatar не передан');
    }

    $file = $_FILES['avatar'];

    if (!empty($file['error'])) {
        sendError('VALIDATION_ERROR', 'Ошибка загрузки файла');
    }

    // Ограничение размера, 2 МБ
    if (!empty($file['size']) && (int)$file['size'] > 2 * 1024 * 1024) {
        sendError('VALIDATION_ERROR', 'Файл слишком большой (максимум 2 МБ)');
    }

    // Проверка, что это изображение
    $imgInfo = @getimagesize($file['tmp_name']);
    if ($imgInfo === false) {
        sendError('VALIDATION_ERROR', 'Файл не является изображением');
    }

    $mime = $imgInfo['mime'] ?? '';
    $extMap = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    if (!isset($extMap[$mime])) {
        sendError('VALIDATION_ERROR', 'Поддерживаются только JPG, PNG, WEBP');
    }

    $ext = $extMap[$mime];

    $uploadDir = APP_BASE_PATH . '/public_html/uploads/avatars';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }

    if (!is_dir($uploadDir) || !is_writable($uploadDir)) {
        sendError('SERVER_ERROR', 'Папка загрузки недоступна для записи');
    }

    $rand = bin2hex(random_bytes(6));
    $filename = 'emp_' . $id . '_' . time() . '_' . $rand . '.' . $ext;

    $absPath = $uploadDir . '/' . $filename;
    $relPath = '/uploads/avatars/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $absPath)) {
        sendError('SERVER_ERROR', 'Не удалось сохранить файл');
    }

    $ok = $this->employees->setAvatarPath($id, $relPath);
    if (!$ok) {
        sendError('SERVER_ERROR', 'Не удалось сохранить путь аватара в БД');
    }

    $employeeRow = $this->employees->getById($id);
    $employee = $employeeRow ? $this->normalizeEmployeeRow($employeeRow) : null;

    sendJson([
        'success' => true,
        'data' => [
            'employee' => $employee,
        ],
    ]);
}

}
