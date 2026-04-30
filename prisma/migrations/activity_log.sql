-- Добавить userId в историю заявок
ALTER TABLE "lead_history" ADD COLUMN "userId" TEXT REFERENCES "users"("id") ON DELETE SET NULL;

-- Журнал действий по заказу
CREATE TABLE "order_activities" (
  "id"        TEXT         NOT NULL,
  "orderId"   TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "action"    TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_activities_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "order_activities_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "order_activities_orderId_idx" ON "order_activities"("orderId");
