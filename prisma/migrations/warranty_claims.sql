-- Гарантийные обращения
CREATE TYPE "WarrantyStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

CREATE TABLE "warranty_claims" (
  "id"          TEXT            NOT NULL,
  "orderId"     TEXT            NOT NULL,
  "description" TEXT            NOT NULL,
  "status"      "WarrantyStatus" NOT NULL DEFAULT 'OPEN',
  "resolvedAt"  TIMESTAMP(3),
  "resolution"  TEXT,
  "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "warranty_claims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "warranty_claims_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
