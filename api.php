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
require_once APP_BASE_PATH . '/app/controllers/KanbanController.php';

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

    sendError('NOT_FOUND', 'Маршрут не найден', 404);


} elseif ($resource === 'work-categories') {

    $controller = new KanbanController($db);

    if ($param1 === null) {
        if ($method === 'GET') {
            $controller->listCategories();
        } elseif ($method === 'POST') {
            $controller->createCategory();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    if ($param1 !== null && ctype_digit($param1) && $param2 === null) {
        $id = (int) $param1;
        if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
            $controller->updateCategory($id);
        } elseif ($method === 'DELETE') {
            $controller->deleteCategory($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    sendError('NOT_FOUND', 'Маршрут не найден', 404);

} elseif ($resource === 'planned-invoices') {

    $controller = new KanbanController($db);

    if ($param1 === null) {
        if ($method === 'GET') {
            $controller->listPlannedInvoices();
        } elseif ($method === 'POST') {
            $controller->createPlannedInvoice();
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    if ($param1 !== null && ctype_digit($param1) && $param2 === null) {
        $id = (int) $param1;
        if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
            $controller->updatePlannedInvoice($id);
        } elseif ($method === 'DELETE') {
            $controller->archivePlannedInvoice($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    if ($param1 !== null && ctype_digit($param1) && $param2 === 'remind') {
        $id = (int) $param1;
        if ($method === 'POST') {
            $controller->remindPlannedInvoice($id);
        } else {
            sendError('NOT_FOUND', 'Маршрут не найден', 404);
        }
    }

    if ($param1 !== null && ctype_digit($param1) && $param2 === 'send') {
        $id = (int) $param1;
        if ($method === 'POST') {
            $controller->sendPlannedInvoice($id);
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

    // /api.php/finance/documents
    if ($method === 'GET' && $param1 === 'documents') {
        $controller->documents();
    }

    sendError('NOT_FOUND', 'Маршрут не найден', 404);

} else {
    sendError('NOT_FOUND', 'Маршрут не найден', 404);
}
