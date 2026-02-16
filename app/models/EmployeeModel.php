<?php

class EmployeeModel
{
    /**
     * @var mysqli
     */
    private $db;

    /**
     * @param mysqli $db
     */
    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll()
    {
        $sql = "
            SELECT
                e.*,
                s.weekday,
                s.is_working,
                s.hour_from,
                s.hour_to
            FROM employees e
            LEFT JOIN employee_schedule s ON s.employee_id = e.id
            WHERE e.is_active = 1
            ORDER BY e.full_name ASC, s.weekday ASC
        ";

        $result = $this->db->query($sql);
        if (!$result) {
            return [];
        }

        $employees = [];

        while ($row = $result->fetch_assoc()) {
            $id = (int) $row['id'];

            if (!isset($employees[$id])) {
                $employees[$id] = [
                    'id'             => $id,
                    'full_name'      => $row['full_name'],
                    'position'       => $row['position'],
                    'email'          => $row['email'],
                    'phone'          => $row['phone'],
                    'employee_type'  => $row['employee_type'],
                    'user_id'        => $row['user_id'] !== null ? (int) $row['user_id'] : null,
                    'telegram_id'    => $row['telegram_id'],
                    'is_default'     => (int) $row['is_default'],
                    'is_on_vacation' => (int) $row['is_on_vacation'],
                    'is_active'      => (int) $row['is_active'],
                    'salary_monthly' => (int) $row['salary_monthly'],
                                           'avatar_path' => $row['avatar_path'] ?? null,
    'avatar_url'  => !empty($row['avatar_path']) ? $row['avatar_path'] : null,
                    'start_date'     => $row['start_date'],
                    'skills_raw'     => $row['skills_raw'],
                    'created_at'     => $row['created_at'],
                    'updated_at'     => $row['updated_at'],
                    'schedule'       => [],
                ];
            }



            if ($row['weekday'] !== null) {
                $weekday = (int) $row['weekday'];

                $employees[$id]['schedule'][$weekday] = [
                    'weekday'    => $weekday,
                    'is_working' => (int) $row['is_working'],
                    'hour_from'  => $row['hour_from'] !== null ? (int) $row['hour_from'] : null,
                    'hour_to'    => $row['hour_to'] !== null ? (int) $row['hour_to'] : null,
                ];
            }
        }

        return array_values($employees);
    }

    public function getById($id)
    {
        $stmt = $this->db->prepare("
            SELECT
                e.*,
                s.weekday,
                s.is_working,
                s.hour_from,
                s.hour_to
            FROM employees e
            LEFT JOIN employee_schedule s ON s.employee_id = e.id
            WHERE e.id = ?
        ");
        if (!$stmt) {
            return null;
        }

        $id = (int) $id;
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();

        if (!$res || $res->num_rows === 0) {
            $stmt->close();
            return null;
        }

        $employee = null;

        while ($row = $res->fetch_assoc()) {
            if ($employee === null) {
                $employee = [
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
                    'skills_raw'     => $row['skills_raw'],
                    'created_at'     => $row['created_at'],
                    'updated_at'     => $row['updated_at'],
                    'schedule'       => [],
                ];
            }

            if ($row['weekday'] !== null) {
                $weekday = (int) $row['weekday'];
                $employee['schedule'][$weekday] = [
                    'weekday'    => $weekday,
                    'is_working' => (int) $row['is_working'],
                    'hour_from'  => $row['hour_from'] !== null ? (int) $row['hour_from'] : null,
                    'hour_to'    => $row['hour_to'] !== null ? (int) $row['hour_to'] : null,
                ];
            }
        }

        $stmt->close();

        return $employee;
    }

    public function create(array $data)
    {
        $fullName      = trim($data['full_name'] ?? '');
        $position      = trim($data['position'] ?? '');
        $email         = trim($data['email'] ?? '');
        $phone         = trim($data['phone'] ?? '');
        $employeeType  = trim($data['employee_type'] ?? '');
        $telegramId    = trim($data['telegram_id'] ?? '');
        $isDefault     = !empty($data['is_default']) ? 1 : 0;
        $isOnVacation  = !empty($data['is_on_vacation']) ? 1 : 0;
        $salaryMonthly = isset($data['salary_monthly']) ? (int) $data['salary_monthly'] : 0;
        $startDate     = !empty($data['start_date']) ? $data['start_date'] : null;
        $skillsRaw     = isset($data['skills_raw']) ? trim($data['skills_raw']) : null;

        if ($isDefault) {
            $this->unsetDefaultForOthers();
        }

        $stmt = $this->db->prepare("
            INSERT INTO employees
              (full_name, position, email, phone, employee_type, telegram_id,
               is_default, is_on_vacation, salary_monthly, start_date, skills_raw)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        if (!$stmt) {
            return null;
        }

        $stmt->bind_param(
            'ssssssiiiss',
            $fullName,
            $position,
            $email,
            $phone,
            $employeeType,
            $telegramId,
            $isDefault,
            $isOnVacation,
            $salaryMonthly,
            $startDate,
            $skillsRaw
        );

        if (!$stmt->execute()) {
            $stmt->close();
            return null;
        }

        $id = $stmt->insert_id;
        $stmt->close();

        if (!empty($data['schedule']) && is_array($data['schedule'])) {
            $this->saveSchedule($id, $data['schedule']);
        }

        return $id;
    }

public function update($id, array $data)
{
    $id = (int) $id;

    $fullName      = trim($data['full_name'] ?? '');
    $position      = trim($data['position'] ?? '');
    $email         = trim($data['email'] ?? '');
    $phone         = trim($data['phone'] ?? '');
    $employeeType  = trim($data['employee_type'] ?? '');
    $telegramId    = trim($data['telegram_id'] ?? '');
    $isDefault     = array_key_exists('is_default', $data) && $data['is_default'] ? 1 : 0;
    $isOnVacation  = array_key_exists('is_on_vacation', $data) && $data['is_on_vacation'] ? 1 : 0;
    $salaryMonthly = isset($data['salary_monthly']) ? (int) $data['salary_monthly'] : 0;
    $startDate     = !empty($data['start_date']) ? $data['start_date'] : null;
    $skillsRaw     = isset($data['skills_raw']) ? trim($data['skills_raw']) : null;

    if ($isDefault) {
        $this->unsetDefaultForOthers($id);
    }

    // --- ДОБАВЛЕНО: читаем старую зарплату до UPDATE ---
    $oldSalary = null;
    $stmtOld = $this->db->prepare("SELECT salary_monthly FROM employees WHERE id = ? LIMIT 1");
    if ($stmtOld) {
        $stmtOld->bind_param('i', $id);
        $stmtOld->execute();
        $resOld = $stmtOld->get_result();
        $rowOld = $resOld ? $resOld->fetch_assoc() : null;
        $stmtOld->close();

        if ($rowOld && isset($rowOld['salary_monthly'])) {
            $oldSalary = (int) $rowOld['salary_monthly'];
        }
    }
    // --- /ДОБАВЛЕНО ---

    $stmt = $this->db->prepare("
        UPDATE employees
        SET full_name      = ?,
            position       = ?,
            email          = ?,
            phone          = ?,
            employee_type  = ?,
            telegram_id    = ?,
            is_default     = ?,
            is_on_vacation = ?,
            salary_monthly = ?,
            start_date     = ?,
            skills_raw     = ?
        WHERE id = ?
    ");

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param(
        'ssssssiiissi',
        $fullName,
        $position,
        $email,
        $phone,
        $employeeType,
        $telegramId,
        $isDefault,
        $isOnVacation,
        $salaryMonthly,
        $startDate,
        $skillsRaw,
        $id
    );

    $ok = $stmt->execute();
    $stmt->close();

    // --- ДОБАВЛЕНО: если зарплата изменилась, пишем историю ---
    if ($ok) {
        // Если старую зарплату не смогли прочитать, считаем что изменения есть, чтобы не терять историю.
        if ($oldSalary === null || $oldSalary !== $salaryMonthly) {
            $this->addSalaryHistory($id, $salaryMonthly);
        }
    }
    // --- /ДОБАВЛЕНО ---

    if ($ok && array_key_exists('schedule', $data) && is_array($data['schedule'])) {
        $this->saveSchedule($id, $data['schedule']);
    }

    return $ok;
}


    public function delete($id)
    {
        $stmt = $this->db->prepare("UPDATE employees SET is_active = 0 WHERE id = ?");
        if (!$stmt) {
            return false;
        }

        $id = (int) $id;
        $stmt->bind_param('i', $id);
        $ok = $stmt->execute();
        $stmt->close();
 
        return $ok;
    }

    public function unsetDefaultForOthers($exceptId = null)
    {
        if ($exceptId !== null) {
            $stmt = $this->db->prepare("UPDATE employees SET is_default = 0 WHERE id <> ?");
            if ($stmt) {
                $exceptId = (int) $exceptId;
                $stmt->bind_param('i', $exceptId);
                $stmt->execute();
                $stmt->close();
            }
        } else {
            $this->db->query("UPDATE employees SET is_default = 0");
        }
    }

    public function saveSchedule($employeeId, array $schedule)
    {
        $stmtDelete = $this->db->prepare("DELETE FROM employee_schedule WHERE employee_id = ?");
        if ($stmtDelete) {
            $employeeId = (int) $employeeId;
            $stmtDelete->bind_param('i', $employeeId);
            $stmtDelete->execute();
            $stmtDelete->close();
        }

        if (empty($schedule)) {
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO employee_schedule (employee_id, weekday, is_working, hour_from, hour_to)
            VALUES (?, ?, ?, ?, ?)
        ");

        if (!$stmt) {
            return;
        }

        foreach ($schedule as $weekday => $info) {
            $weekday = (int) $weekday;
            if ($weekday < 1 || $weekday > 7) {
                continue;
            }

            $employeeId = (int) $employeeId;
            $isWorking = !empty($info['enabled']) ? 1 : 0;
            $fromHour  = isset($info['from_hour']) ? (int) $info['from_hour'] : null;
            $toHour    = isset($info['to_hour']) ? (int) $info['to_hour'] : null;

            $stmt->bind_param(
                'iiiii',
                $employeeId,
                $weekday,
                $isWorking,
                $fromHour,
                $toHour
            );
            $stmt->execute();
        }

        $stmt->close();
    }

    public function setAvatarPath($id, $avatarPath)
{
    $stmt = $this->db->prepare("UPDATE employees SET avatar_path = ? WHERE id = ?");
    if (!$stmt) {
        return false;
    }

    $id = (int) $id;
    $stmt->bind_param('si', $avatarPath, $id);

    $ok = $stmt->execute();
    $stmt->close();

    return $ok;
}

public function getSalaryMonthly($employeeId)
{
    $employeeId = (int)$employeeId;

    $stmt = $this->db->prepare("SELECT salary_monthly FROM employees WHERE id = ? LIMIT 1");
    if (!$stmt) {
        return null;
    }

    $stmt->bind_param('i', $employeeId);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $stmt->close();

    return $row ? (int)$row['salary_monthly'] : null;
}

public function addSalaryHistory($employeeId, $amount)
{
    $employeeId = (int)$employeeId;
    $amount = (int)$amount;

    $stmt = $this->db->prepare("
        INSERT INTO employee_salary_history (employee_id, amount, changed_at)
        VALUES (?, ?, NOW())
    ");
    if (!$stmt) {
        return false;
    }

    $stmt->bind_param('ii', $employeeId, $amount);
    $ok = $stmt->execute();
    $stmt->close();

    return $ok;
}

public function getSalaryHistoryLast($employeeId, $limit = 20)
{
    $employeeId = (int)$employeeId;
    $limit = (int)$limit;
    if ($limit < 1) {
        $limit = 1;
    }
    if ($limit > 100) {
        $limit = 100;
    }

    $stmt = $this->db->prepare("
        SELECT changed_at AS date, amount
        FROM employee_salary_history
        WHERE employee_id = ?
        ORDER BY changed_at DESC
        LIMIT ?
    ");
    if (!$stmt) {
        return [];
    }

    $stmt->bind_param('ii', $employeeId, $limit);
    $stmt->execute();
    $res = $stmt->get_result();

    $rows = [];
    while ($res && ($r = $res->fetch_assoc())) {
        $rows[] = [
            'date' => $r['date'],
            'amount' => (int)$r['amount'],
        ];
    }

    $stmt->close();

    // Для фронта удобнее по возрастанию, чтобы slice(-2) давал последние записи
    $rows = array_reverse($rows);

    return $rows;
}

}
