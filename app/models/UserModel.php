<?php
// app/models/UserModel.php

class UserModel
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

    /**
     * Получить пользователя по id.
     *
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        $sql = 'SELECT id, login, password_hash, role, is_active
                FROM users
                WHERE id = ?
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            return null;
        }

        $id = (int)$id;
        $stmt->bind_param('i', $id);

        if (!$stmt->execute()) {
            $stmt->close();
            return null;
        }

        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        return $row ?: null;
    }

    /**
     * Получить пользователя по логину.
     *
     * @param string $login
     * @return array|null
     */
    public function getByLogin($login)
    {
        $sql = 'SELECT id, login, password_hash, role, is_active
                FROM users
                WHERE login = ?
                LIMIT 1';

        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            return null;
        }

        $login = (string)$login;
        $stmt->bind_param('s', $login);

        if (!$stmt->execute()) {
            $stmt->close();
            return null;
        }

        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        return $row ?: null;
    }
}
