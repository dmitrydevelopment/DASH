# Beget DB query runner (GitHub Actions)

Workflow: `.github/workflows/beget-db-query.yml`

## Как использовать
1. Открой GitHub → **Actions** → **Beget DB query runner**.
2. Нажми **Run workflow**.
3. В поле `sql` вставь SQL (можно несколько запросов через `;`).
4. Если нужна только проверка текста — включи `dry_run=true`.
5. Запусти workflow.

## Пример
```sql
CREATE TABLE IF NOT EXISTS codex_connection_test (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  note VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO codex_connection_test (note) VALUES ('test from github actions');
SELECT * FROM codex_connection_test ORDER BY id DESC LIMIT 5;
```

## Важно
- Workflow выполняет SQL **на прод-базе**.
- По умолчанию подключается к `localhost` БД `kostyasw_dash` от пользователя `kostyasw_dash`.
- Для DDL/DML рекомендуется сначала запускать с `dry_run=true`.
