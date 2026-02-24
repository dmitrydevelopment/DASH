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
     * Требует роль(и), иначе отдает 403 и завершает выполнение.
     *
     * @param string|array $role
     * @return array
     */
    public static function requireRole($role)
    {
        $user = self::requireAuth();
        $currentRole = strtolower((string)($user['role'] ?? ''));

        if (is_array($role)) {
            $allowedRoles = array_map(function ($item) {
                return strtolower((string)$item);
            }, $role);

            // Совместимость со старыми вызовами ['admin', 'owner'] на базах,
            // где у обычных сотрудников роль хранится как 'employee'.
            if ($currentRole === 'employee' && in_array('owner', $allowedRoles, true)) {
                return $user;
            }

            if (!in_array($currentRole, $allowedRoles, true)) {
                sendError('FORBIDDEN', 'Недостаточно прав', 403);
            }
            return $user;
        }

        if ($currentRole !== strtolower((string)$role)) {
            sendError('FORBIDDEN', 'Недостаточно прав', 403);
        }

        return $user;
    }
}
