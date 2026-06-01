-- Клиенты v2: температура (COLD/WARM/HOT) + тип (PRIVATE/LEGAL/GOVERNMENT)
-- Идемпотентно: можно запускать повторно.
-- VPS: docker compose exec -T postgres psql -U crm -d crm_atlantic < prisma/migrations/clients_v2.sql

DO $$ BEGIN
  CREATE TYPE "ClientTemperature" AS ENUM ('COLD', 'WARM', 'HOT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "temperature" "ClientTemperature" NOT NULL DEFAULT 'COLD';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ClientStatus' AND e.enumlabel = 'REGULAR'
  ) THEN
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
  END IF;
END $$;
