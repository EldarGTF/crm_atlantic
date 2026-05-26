# Миграции базы данных

## Новый проект

```bash
npx prisma db push
# или
npx prisma migrate dev --name init
```

## Production

```bash
npx prisma migrate deploy
```

## Исторические файлы

- `init.sql` — начальный дамп (может не совпадать с текущей `schema.prisma`, в т.ч. enum `Role`).
- `migrations/activity_log.sql`, `migrations/warranty_claims.sql` — ручные патчи.

**Источник истины:** `schema.prisma`. При расхождении — `prisma db push` на dev или новая миграция через `prisma migrate dev`.
