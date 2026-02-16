<?php

/* 
 * This file is part of is free software.
 */
/*
    Created on : 8 дек. 2025 г., 10:42:15
    Author     : Dmitrij Nedeljković https://dmitrydevelopment.com/
*/

// app/bootstrap.php

if (!defined('APP_BASE_PATH')) {
    define('APP_BASE_PATH', dirname(__DIR__));
}

if (!defined('APP_ENV')) {
    // На случай, если config не был подключен.
    define('APP_ENV', 'local');
}

// Настройки ошибок.
if (APP_ENV === 'local') {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
    ini_set('display_errors', '0');
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Ожидается, что константы DB_HOST и т.д. объявлены в config/config.php.
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

if ($mysqli->connect_errno) {
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'DB_CONNECTION_ERROR',
            'message' => 'Ошибка подключения к базе данных'
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$mysqli->set_charset('utf8mb4');

function sendJson(array $data, $statusCode = 200)
{
    if (!headers_sent()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sendError($code, $message, $statusCode = 400)
{
    sendJson([
        'success' => false,
        'error' => [
            'code' => $code,
            'message' => $message
        ]
    ], $statusCode);
}

return $mysqli;
