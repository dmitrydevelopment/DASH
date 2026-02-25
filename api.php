<?php

/*
 * This file is part of is free software.
 */
/*
    Created on : 8 дек. 2025 г., 10:45:58
    Author     : Dmitrij Nedeljković https://dmitrydevelopment.com/
*/

// public_html/api.php

require_once __DIR__ . '/config/config.php';
$db = require __DIR__ . '/app/bootstrap.php';

require_once APP_BASE_PATH . '/app/auth/Auth.php';
require_once APP_BASE_PATH . '/app/controllers/AuthController.php';
require_once APP_BASE_PATH . '/app/controllers/EmployeeController.php';
require_once APP_BASE_PATH . '/app/controllers/ClientController.php';
require_once APP_BASE_PATH . '/app/controllers/DadataController.php';
require_once APP_BASE_PATH . '/app/controllers/SettingsController.php';
require_once APP_BASE_PATH . '/app/controllers/FinanceController.php';

/**
 * Унифицированное получение тела запроса как массива.
 * Поддерживается application/json и обычный POST.
 *
 * @return array
 */
function getJsonPayload()
{
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    $payload = [];

    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if ($raw !== false && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        }
    } elseif (!empty($_POST)) {
        $payload = $_POST;
    }

    return $payload;
}

// Разбор пути.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Поддержка вариантов:
// - /api/auth/login  (если настроен rewrite на api.php)
// - /api.php/auth/login
if (strpos($path, '/api.php') === 0) {
    $path = substr($path, strlen('/api.php'));
} elseif (strpos($path, '/api/') === 0) {
    $path = substr($path, strlen('/api'));
}

$segments = array_values(array_filter(explode('/', $path)));

$resource = isset($segments[0]) ? $segments[0] : '';
$param1   = isset($segments[1]) ? $segments[1] : null;
$param2   = isset($segments[2]) ? $segments[2] : null;

$method = $_SERVER['REQUEST_METHOD'];

// Маршрутизация.
if ($resource === 'auth') {

    $controller = new AuthController($db);

    if ($method === 'POST' && $param1 === 'login') {
        $controller->login();
    } elseif ($method === 'POST' && $param1 === 'logout') {
        $controller->logout();
    } elseif ($method === 'GET' && $param1 === 'me') {
        $controller->me();
    } else {
        sendError('NOT_FOUND', 'Маршрут не найден', 404);
    }

} elseif ($resource === 'employees') {

    $controller = new EmployeeController($db);

    // /api.php/employees
    // GET  - список
    // POST - создание
    if ($param1 === null) {
        if ($method === 'GET') {
            $controller->index();
        } elseif ($method === 'POST') {
            $controller->store();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/employees/{id}
    // POST/PUT/PATCH - обновление
    // DELETE         - удаление (мягкое)
    if ($param1 !== null && ctype_digit($param1) && $param2 === null) {
        $id = (int) $param1;

        if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
            $controller->update($id);
        } elseif ($method === 'DELETE') {
            $controller->delete($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/employees/{id}/schedule
    // POST - сохранить расписание
    if ($param1 !== null && ctype_digit($param1) && $param2 === 'schedule') {
        $id = (int) $param1;

        if ($method === 'POST') {
            $controller->saveSchedule($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/employees/{id}/avatar
    // POST - загрузить аватар
    if ($param1 !== null && ctype_digit($param1) && $param2 === 'avatar') {
        $id = (int) $param1;

        if ($method === 'POST') {
            $controller->uploadAvatar($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // Если ни один из вариантов не сработал.
    sendError('NOT_FOUND', 'Маршрут не найден', 404);

} elseif ($resource === 'clients') {

    $controller = new ClientController($db);
    if ($method === 'GET' && $param1 === 'stats') {
        $controller->stats();
    }

    // /api.php/clients
    if ($param1 === null) {
        if ($method === 'GET') {
            $controller->index();
        } elseif ($method === 'POST') {
            $controller->store();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/clients/{id}
    if ($param1 !== null && ctype_digit($param1) && $param2 === null) {
        $id = (int)$param1;

        if ($method === 'GET') {
            $controller->show($id);
        } elseif ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
            $controller->update($id);
        } elseif ($method === 'DELETE') {
            $controller->delete($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    sendError('NOT_FOUND', 'Маршрут не найден', 404);

} elseif ($resource === 'dadata') {

    $controller = new DadataController();

    // /api.php/dadata/party?q=...
    if ($method === 'GET' && $param1 === 'party') {
        $controller->partySuggest();
    }

    sendError('NOT_FOUND', 'Маршрут не найден', 404);

} elseif ($resource === 'settings') {

    $controller = new SettingsController($db);

    // /api.php/settings
    if ($param1 === null) {
        if ($method === 'GET') {
            $controller->show();
        } elseif ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
            $controller->save();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/settings/work-categories
    if ($param1 === 'work-categories' && $param2 === null) {
        if ($method === 'GET') {
            $controller->workCategoriesIndex();
        } elseif ($method === 'POST') {
            $controller->workCategoriesStore();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/settings/work-categories/{id}
    if ($param1 === 'work-categories' && $param2 !== null && ctype_digit($param2)) {
        $id = (int) $param2;

        if ($method === 'PUT' || $method === 'PATCH' || $method === 'POST') {
            $controller->workCategoriesUpdate($id);
        } elseif ($method === 'DELETE') {
            $controller->workCategoriesDelete($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    sendError('NOT_FOUND', 'Маршрут не найден', 404);

} elseif ($resource === 'finance') {

    $controller = new FinanceController($db);

    // /api.php/finance/download?token=...
    if ($method === 'GET' && $param1 === 'download') {
        $controller->download();
    }

    // /api.php/finance/email-open?token=...
    if ($method === 'GET' && $param1 === 'email-open') {
        $controller->emailOpen();
    }

    // /api.php/finance/invoice-plans
    if ($param1 === 'invoice-plans' && $param2 === null) {
        if ($method === 'GET') {
            $controller->invoicePlansIndex();
        } elseif ($method === 'POST') {
            $controller->invoicePlansCreate();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/invoice-plans/send-end-month-now
    if ($param1 === 'invoice-plans' && $param2 === 'send-end-month-now') {
        if ($method === 'POST') {
            $controller->invoicePlansSendEndMonthNow();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/invoice-plans/{id}
    if ($param1 === 'invoice-plans' && $param2 !== null && ctype_digit($param2)) {
        $id = (int)$param2;

        if ($method === 'DELETE') {
            $controller->invoicePlansDelete($id);
        } elseif (($method === 'PATCH' || $method === 'PUT') && !isset($segments[3])) {
            $controller->invoicePlansUpdate($id);
        } elseif ($method === 'POST' && isset($segments[3]) && $segments[3] === 'send') {
            $controller->invoicePlansSend($id);
        } elseif ($method === 'POST' && isset($segments[3]) && $segments[3] === 'remind') {
            $controller->invoicePlansRemind($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/status-board
    if ($param1 === 'status-board' && $param2 === null) {
        if ($method === 'GET') {
            $controller->statusBoard();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/overview
    if ($param1 === 'overview' && $param2 === null) {
        if ($method === 'GET') {
            $controller->overview();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/payments-history
    if ($param1 === 'payments-history' && $param2 === null) {
        if ($method === 'GET') {
            $controller->paymentsHistory();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/payments-unknown
    if ($param1 === 'payments-unknown' && $param2 === null) {
        if ($method === 'GET') {
            $controller->paymentsUnknown();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/payments-candidates
    if ($param1 === 'payments-candidates' && $param2 === null) {
        if ($method === 'GET') {
            $controller->paymentsCandidateInvoices();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/payments-match
    if ($param1 === 'payments-match' && $param2 === null) {
        if ($method === 'POST') {
            $controller->paymentsMatch();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/tbank-webhook
    if ($param1 === 'tbank-webhook' && $param2 === null) {
        if ($method === 'POST') {
            $controller->tbankWebhook();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/receivables
    if ($param1 === 'receivables' && $param2 === null) {
        if ($method === 'GET') {
            $controller->receivables();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/acts
    if ($param1 === 'acts' && $param2 === null) {
        if ($method === 'GET') {
            $controller->actsIndex();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/projects
    if ($param1 === 'projects' && $param2 === null) {
        if ($method === 'GET') {
            $controller->projectsIndex();
        } elseif ($method === 'POST') {
            $controller->projectsCreate();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/project-statuses
    if ($param1 === 'project-statuses' && $param2 === null) {
        if ($method === 'GET') {
            $controller->projectStatuses();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    // /api.php/finance/projects/{id}
    if ($param1 === 'projects' && $param2 !== null && ctype_digit($param2)) {
        $id = (int)$param2;

        if ($method === 'DELETE') {
            $controller->projectsDelete($id);
        } elseif ($method === 'PATCH' || $method === 'PUT') {
            $controller->projectsUpdate($id);
        } elseif ($method === 'POST' && isset($segments[3]) && $segments[3] === 'invoice') {
            $controller->projectsSendInvoice($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    sendError('NOT_FOUND', 'Маршрут не найден', 404);

} else {
    sendError('NOT_FOUND', 'Маршрут не найден', 404);
}
