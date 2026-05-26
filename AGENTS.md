# CRM Atlantic — заметки для агента

## Стек

Next.js 16 (App Router), `proxy.ts` для auth/ролей на маршрутах, server actions в `app/actions/`.

## Авторизация

- `lib/auth-guards.ts`: `requireSession()`, `requireRole(allowed)`, `getAuthorizedSession()` для API.
- `lib/permissions.ts`: группы ролей (`MANAGEMENT`, `ORDERS`, …).
- Каждый server action должен вызывать guard в начале.
- JWT в cookie `crm_session`; роль для проверок — из БД в `requireSession`.

## Prisma

Клиент: `@/lib/generated/prisma/client`. После изменения схемы: `npx prisma generate`.

## Ошибки Prisma

Используйте `getPrismaUserMessage()` из `lib/prisma-errors.ts` для P2002/P2025.

## Next.js 16

Не добавляйте `middleware.ts` — только корневой `proxy.ts`. См. `node_modules/next/dist/docs/` при сомнениях.
