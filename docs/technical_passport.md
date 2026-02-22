# Технический паспорт проекта DASH

## 1) Назначение
DASH — CRM/операционный дашборд агентства.

Система покрывает:
- учет пользователей и авторизацию;
- управление сотрудниками и клиентами;
- финансовый контур (счета, акты, события отправки, загрузки, синхронизация платежей).

## 2) Технологический стек
- Backend: PHP (без фреймворка), `mysqli`.
- Database: MySQL.
- Frontend: HTML + CSS + Vanilla JavaScript, Chart.js.
- Фоновые процессы: cron-скрипты на PHP.

## 3) Точки входа
- `index.php` — вход в приложение, проверка сессии, выдача `crm.html`.
- `api.php` — HTTP API с ручной маршрутизацией.
- `cron/finance_send_invoices.php` — формирование и отправка счетов.
- `cron/finance_send_acts.php` — формирование и отправка актов.
- `cron/finance_sync_payments.php` — синхронизация банковских операций и обновление статусов оплат.

## 4) API (укрупненная карта)
- `auth`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /auth/me`
- `employees`
  - `GET /employees`
  - `POST /employees`
  - `POST|PUT|PATCH|DELETE /employees/{id}`
  - `POST /employees/{id}/schedule`
  - `POST /employees/{id}/avatar`
- `clients`
  - `GET /clients`
  - `POST /clients`
  - `GET|POST|PUT|PATCH|DELETE /clients/{id}`
  - `GET /clients/stats`
- `settings`
  - `GET /settings`
  - `POST|PUT|PATCH /settings`
- `finance`
  - `GET /finance/download`
  - `GET /finance/email-open`
- `dadata`
  - `GET /dadata/party`

## 5) База данных
Файлы схемы и дампа в репозитории:
- `kostyasw_dash.sql` — дамп базы.
- `sql/schema_initial.sql` — SQL-схема проекта.

Основные группы таблиц:
- Доступ и пользователи: `users`.
- Сотрудники: `employees`, `employee_schedule`, `employee_salary_history`, `crm_employee_roles`.
- Клиенты: `clients`, `client_invoice_items`, `client_act_items`.
- Настройки: `crm_settings`.
- Финансы: `finance_documents`, `finance_send_events`, `finance_download_events`, `finance_bank_operations`, `finance_sync_state`.

## 6) Frontend-структура
Основной UI расположен в `crm.html`.

JavaScript организован по файлам:
- `public_html/js/01-core-data.js` — общие данные, state, вспомогательные базовые функции.
- `public_html/js/02-business-modules.js` — доменные модули интерфейса (сотрудники, клиенты, финансы, аналитика).
- `public_html/js/03-settings-forms.js` — формы, модальные окна, настройки и обработчики действий.

В `crm.html` эти файлы подключаются последовательно.

`app.js` присутствует как совместимый загрузчик модулей для сценариев, где требуется legacy-подключение.
