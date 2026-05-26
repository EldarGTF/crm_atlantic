# CRM Atlantic Company

CRM для оконной компании: заявки, клиенты, заказы, замеры, производство, монтаж, гарантия, аналитика.

Стек: **Next.js 16**, **React 19**, **Prisma 7** (PostgreSQL), **Supabase Storage**, Web Push, Mobizon SMS.

## Требования

- Node.js 20+
- PostgreSQL 15+
- Аккаунты Supabase и Mobizon (опционально для SMS)

## Быстрый старт

```bash
git clone https://github.com/EldarGTF/crm_atlantic.git
cd crm_atlantic
cp .env.example .env
# Заполните DATABASE_URL и SESSION_SECRET (минимум 32 символа)

npm install
npx prisma generate
npx prisma db push   # или prisma migrate deploy на production

# Первый администратор (пароль только через env)
set ADMIN_PASSWORD=your-secure-password
npx tsx scripts/create-admin.ts

npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) и войдите с `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Переменные окружения

См. [`.env.example`](.env.example). Обязательные:

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Секрет JWT-сессии (≥ 32 символов в production) |

Опциональные: Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), VAPID для push, Mobizon для SMS.

## Скрипты

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production-сборка |
| `npm run start` | Запуск после build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Проверка TypeScript |
| `npm run db:push` | Синхронизация схемы с БД (dev) |
| `npm run db:migrate` | Миграции (production) |
| `npm run create-admin` | Создать/обновить админа |

## Роли

`ADMIN`, `MANAGER`, `ECONOMIST`, `MEASURER`, `INSTALLER`, `PRODUCTION`, `PRODUCTION_GLASS`, `PRODUCTION_PVC`, `PRODUCTION_ALUMINUM`.

Маршруты ограничены в `proxy.ts`; server actions — в `lib/permissions.ts` + `lib/auth-guards.ts`.

## База данных

- Схема: `prisma/schema.prisma`
- Для **нового** проекта: `npx prisma db push` или `npx prisma migrate dev`
- Старые SQL-файлы в `prisma/migrations/*.sql` и `prisma/init.sql` — исторические; ориентируйтесь на актуальную Prisma-схему

## Безопасность

- В production задайте сильный `SESSION_SECRET`
- Не коммитьте `.env`
- Загрузка файлов: только разрешённые MIME и папки (`app/api/upload`)
- Rate limit на логин: 5 попыток / 15 мин на пару IP+email (in-memory; для нескольких инстансов нужен Redis)

## CI

GitHub Actions: lint, typecheck, build — см. `.github/workflows/ci.yml`.
