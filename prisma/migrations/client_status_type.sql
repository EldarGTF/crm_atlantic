-- Миграция типа клиента: REGULAR/RETURNING/VIP → PRIVATE/LEGAL/GOVERNMENT
-- Выполнить на VPS один раз: docker compose exec -T db psql -U crm -d crm < prisma/migrations/client_status_type.sql

ALTER TYPE "ClientStatus" RENAME TO "ClientStatus_old";

CREATE TYPE "ClientStatus" AS ENUM ('PRIVATE', 'LEGAL', 'GOVERNMENT');

ALTER TABLE "clients" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "clients"
  ALTER COLUMN "status" TYPE "ClientStatus"
  USING (
    CASE "status"::text
      WHEN 'REGULAR' THEN 'PRIVATE'::"ClientStatus"
      WHEN 'RETURNING' THEN 'PRIVATE'::"ClientStatus"
      WHEN 'VIP' THEN 'LEGAL'::"ClientStatus"
      ELSE 'PRIVATE'::"ClientStatus"
    END
  );

ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'PRIVATE'::"ClientStatus";

DROP TYPE "ClientStatus_old";
