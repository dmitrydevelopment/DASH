<?php

/* 
 * This file is part of is free software.
 */
/*
    Created on : 8 дек. 2025 г., 10:45:44
    Author     : Dmitrij Nedeljković https://dmitrydevelopment.com/
*/

// public_html/index.php

require_once __DIR__ . '/config/config.php';
$db = require __DIR__ . '/app/bootstrap.php';
require_once APP_BASE_PATH . '/app/auth/Auth.php';

if (!Auth::check()) {
    ?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Вход в CRM</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        html, body {
            height: 100%;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #0f172a;
            color: #e5e7eb;
        }
        .login-wrapper {
            min-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-card {
            background: #020617;
            padding: 32px 36px;
            border-radius: 16px;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.9);
            width: 100%;
            max-width: 380px;
            box-sizing: border-box;
        }
        .login-card h1 {
            margin: 0 0 8px;
            font-size: 22px;
            font-weight: 600;
            color: #f9fafb;
        }
        .login-card p {
            margin: 0 0 24px;
            font-size: 13px;
            color: #9ca3af;
        }
        .field-label {
            display: block;
            font-size: 12px;
            margin-bottom: 6px;
            color: #9ca3af;
        }
        .field-input {
            width: 100%;
            box-sizing: border-box;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid #1f2937;
            background: #020617;
            color: #e5e7eb;
            font-size: 14px;
            outline: none;
        }
        .field-input:focus {
            border-color: #4f46e5;
        }
        .field-group {
            margin-bottom: 16px;
        }
        .login-button {
            width: 100%;
            border: none;
            border-radius: 999px;
            padding: 10px 16px;
            margin-top: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            background: #4f46e5;
            color: #f9fafb;
        }
        .login-button:disabled {
            opacity: 0.6;
            cursor: default;
        }
        .error-message {
            margin-top: 12px;
            font-size: 13px;
            color: #f97373;
            min-height: 18px;
        }
    </style>
</head>
<body>
<div class="login-wrapper">
    <div class="login-card">
        <h1>Вход в CRM</h1>
        <p>Авторизуйтесь для доступа к панели агентства.</p>
        <form id="login-form">
            <div class="field-group">
                <label class="field-label" for="login">Логин</label>
                <input class="field-input" type="text" id="login" name="login" autocomplete="username">
            </div>
            <div class="field-group">
                <label class="field-label" for="password">Пароль</label>
                <input class="field-input" type="password" id="password" name="password" autocomplete="current-password">
            </div>
            <button class="login-button" type="submit" id="login-submit">Войти</button>
            <div class="error-message" id="login-error"></div>
        </form>
    </div>
</div>
<script>
    (function () {
        var form = document.getElementById('login-form');
        var submitButton = document.getElementById('login-submit');
        var errorBox = document.getElementById('login-error');

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var login = form.login.value.trim();
            var password = form.password.value;

            if (!login || !password) {
                errorBox.textContent = 'Укажите логин и пароль';
                return;
            }

            submitButton.disabled = true;
            errorBox.textContent = '';

            fetch('/api.php/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    login: login,
                    password: password
                })
            })
                .then(function (response) {
                    return response.json().then(function (data) {
                        return {
                            ok: response.ok,
                            status: response.status,
                            data: data
                        };
                    });
                })
                .then(function (result) {
                    if (result.ok && result.data && result.data.success) {
                        window.location.href = '/';
                        return;
                    }

                    var message = 'Ошибка авторизации';
                    if (result.data && result.data.error && result.data.error.message) {
                        message = result.data.error.message;
                    }
                    errorBox.textContent = message;
                })
                .catch(function () {
                    errorBox.textContent = 'Не удалось выполнить запрос. Повторите попытку позже.';
                })
                .finally(function () {
                    submitButton.disabled = false;
                });
        });
    })();
</script>
</body>
</html>
<?php
    exit;
}

readfile(__DIR__ . '/crm.html');
