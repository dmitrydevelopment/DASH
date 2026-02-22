<?php
// app/controllers/AuthController.php

require_once APP_BASE_PATH . '/app/models/UserModel.php';
require_once APP_BASE_PATH . '/app/auth/Auth.php';

class AuthController
{
    /**
     * @var UserModel
     */
    private $users;

    /**
     * @param mysqli $db
     */
    public function __construct($db)
    {
        $this->users = new UserModel($db);
    }

    /**
     * POST /api/auth/login
     */
    public function login()
    {
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        $payload = [];

        if (strpos($contentType, 'application/json') !== false) {
            $raw = file_get_contents('php://input');
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        } else {
            $payload = $_POST;
        }

        $login = isset($payload['login']) ? trim((string)$payload['login']) : '';
        $password = isset($payload['password']) ? (string)$payload['password'] : '';

        if ($login === '' || $password === '') {
            sendError('VALIDATION_ERROR', 'Укажите логин и пароль', 400);
        }

        $user = $this->users->getByLogin($login);
        if (!$user) {
            sendError('INVALID_CREDENTIALS', 'Неверный логин или пароль', 401);
        }

        if (!(int)$user['is_active']) {
            sendError('USER_INACTIVE', 'Пользователь заблокирован', 403);
        }

        if (!password_verify($password, $user['password_hash'])) {
            sendError('INVALID_CREDENTIALS', 'Неверный логин или пароль', 401);
        }

        $sessionUser = [
            'id'    => (int)$user['id'],
            'login' => $user['login'],
            'role'  => $user['role']
        ];

        $_SESSION['user'] = $sessionUser;

        sendJson([
            'success' => true,
            'data'    => [
                'user' => $sessionUser
            ]
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout()
    {
        Auth::requireAuth();

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();

        sendJson(['success' => true]);
    }

    /**
     * GET /api/auth/me
     */
    public function me()
    {
        $user = Auth::requireAuth();

        sendJson([
            'success' => true,
            'data'    => [
                'user' => $user
            ]
        ]);
    }
}
