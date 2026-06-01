-- Устарело: используйте prisma/migrations/clients_v2.sql (температура + тип клиента)
-- VPS: docker compose exec -T postgres psql -U crm -d crm_atlantic < prisma/migrations/clients_v2.sql

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
