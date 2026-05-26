# Развёртывание CRM на VPS в Казахстане

Стек на одном сервере: **Docker Compose** → Nginx + Next.js + PostgreSQL + MinIO (файлы).

## Требования к VPS

| Параметр | Минимум | Рекомендуется |
|----------|---------|---------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Диск | 40 GB SSD | 80+ GB SSD |
| ОС | Ubuntu 22.04 / 24.04 | |

Провайдеры в KZ (примеры): [PS.kz](https://www.ps.kz), [Hoster.kz](https://hoster.kz), [Servercore](https://servercore.com), [Yandex Cloud KZ](https://yandex.cloud/ru-kz) (VM в `kz1`).

## 1. Подготовка сервера

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git docker.io docker-compose-plugin
sudo systemctl enable docker --now
sudo usermod -aG docker $USER
# перелогиньтесь
```

## 2. Клонирование проекта

```bash
cd /opt
sudo git clone https://github.com/EldarGTF/crm_atlantic.git
sudo chown -R $USER:$USER crm_atlantic
cd crm_atlantic
```

## 3. Настройка окружения

```bash
cp .env.vps.example .env
nano .env
```

Обязательно задайте:

- `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `SESSION_SECRET` (≥ 32 символов)
- `S3_PUBLIC_URL=https://ваш-домен.kz/files` — как пользователи открывают файлы

## 4. DNS

A-запись домена → IP вашего VPS, например:

`crm.atlantic.kz` → `203.0.113.10`

## 5. Запуск

```bash
docker compose build
docker compose up -d
docker compose ps
```

Проверка: откройте `http://IP_СЕРВЕРА` — должна открыться страница входа.

## 6. Первый администратор

```bash
# в .env задайте ADMIN_PASSWORD, затем:
docker compose run --rm --entrypoint npx app tsx scripts/create-admin.ts
```

## 7. HTTPS (Let's Encrypt)

Установите certbot на хост (не в контейнере) и расширьте `deploy/nginx.conf` под SSL, либо используйте Caddy как reverse proxy.

Пример с certbot + nginx на хосте:

```bash
sudo apt install certbot python3-certbot-nginx
# сначала настройте server_name в nginx на домен
sudo certbot --nginx -d crm.atlantic.kz
```

После HTTPS обновите в `.env`:

`S3_PUBLIC_URL=https://crm.atlantic.kz/files`

и перезапустите: `docker compose up -d --force-recreate app`

## 8. Обновление версии

```bash
cd /opt/crm_atlantic
git pull
docker compose build app
docker compose up -d
```

## 9. Резервное копирование

```bash
# База
docker compose exec postgres pg_dump -U crm crm_atlantic > backup-$(date +%F).sql

# Файлы MinIO
docker compose exec minio mc mirror local/crm-files /backup/files
```

Настройте cron на сервере (ежедневно).

## 10. Mobizon SMS

В `.env` укажите ключи Mobizon — домен `api.mobizon.kz` уже по умолчанию.

## Архитектура

```text
Интернет → Nginx (:80/443)
            ├─ /        → Next.js (app:3000)
            └─ /files/  → MinIO (bucket crm-files)
PostgreSQL — только внутри Docker-сети
```

## Отличие от Vercel + Supabase

| | Vercel | VPS KZ |
|---|--------|--------|
| Задержка в KZ | EU, ~100 ms | Локально, ~5–20 ms |
| Файлы | Supabase cloud | MinIO на том же сервере |
| Стоимость | по трафику | фикс VPS |
| Администрирование | минимум | вы сами (бэкапы, SSL) |

## Проблемы

**Не грузятся фото** — проверьте `S3_PUBLIC_URL` (должен совпадать с тем, как nginx отдаёт `/files/`).

**502 от nginx** — `docker compose logs app` — часто нет `SESSION_SECRET` или БД не поднялась.

**MinIO** — консоль только внутри сети: `docker compose port minio 9001` (не открывайте наружу без пароля).
