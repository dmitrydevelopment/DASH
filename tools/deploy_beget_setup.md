# Автодеплой на Beget после push в main

Workflow: `.github/workflows/deploy-beget-on-main.yml`.

## Что делает
После каждого `push` в `main` (и при ручном запуске `workflow_dispatch`) выполняет на сервере:

```bash
cd ~/dash.k-sud.com/public_html
git fetch --prune origin
git checkout main
git reset --hard origin/main
git clean -fd
```

## Пошаговая настройка в GitHub (обязательно)
1. Открой репозиторий → **Settings → Secrets and variables → Actions → Secrets**.
2. Добавь секреты:
   - `BEGET_SSH_HOST` = `kostyasw.beget.tech`
   - `BEGET_SSH_USER` = `kostyasw_dd1`
   - `BEGET_SSH_PASSWORD` = `<пароль от SSH>`
3. Убедись, что workflow-файл лежит в ветке `main`.
4. Открой **Actions** и запусти workflow вручную (**Run workflow**) один раз для проверки.

> Ошибка `Error: missing server host` означает, что `BEGET_SSH_HOST` пустой/не заданный в GitHub Secrets/Variables.

## Пошаговая настройка на Beget (обязательно)
1. В `~/dash.k-sud.com/public_html` должен быть git-репозиторий.
2. Должен быть настроен `origin` на GitHub-репозиторий.
3. На сервере должны быть сохранены git-креды/SSH-ключ для `git fetch`.

Пример проверки на сервере:

```bash
cd ~/dash.k-sud.com/public_html
git remote -v
git fetch --prune origin
git checkout main
git reset --hard origin/main
git clean -fd
```

## Проверка
- После push в `main` открой: **GitHub → Actions → Deploy to beget after push to main**.
- `Validate deploy inputs` должен пройти успешно.
- `Run deploy command over SSH` должен завершиться со статусом `Success`.
