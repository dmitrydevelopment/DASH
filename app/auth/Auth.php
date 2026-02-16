<?php
// app/auth/Auth.php

class Auth
{
    public static function check()
    {
        return isset($_SESSION['user']) && isset($_SESSION['user']['id']);
    }

    public static function user()
    {
        return self::check() ? $_SESSION['user'] : null;
    }

    public static function id()
    {
        return self::check() ? (int)$_SESSION['user']['id'] : null;
    }

    public static function role()
    {
        return self::check() ? $_SESSION['user']['role'] : null;
    }

    /**
     * Требует авторизацию, иначе отдает 401 и завершает выполнение.
     *
     * @return array
     */
    public static function requireAuth()
    {
        if (!self::check()) {
            sendError('UNAUTHORIZED', 'Требуется авторизация', 401);
        }

        return $_SESSION['user'];
    }

    /**
     * Требует конкретную роль, иначе отдает 403 и завершает выполнение.
     *
     * @param string $role
     * @return array
     */
    public static function requireRole($role)
    {
        $user = self::requireAuth();

        if ($user['role'] !== $role) {
            sendError('FORBIDDEN', 'Недостаточно прав', 403);
        }

        return $user;
    }
}
