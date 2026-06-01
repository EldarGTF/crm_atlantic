"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const needsMigration =
    /ClientStatus|ClientTemperature|temperature|enum/i.test(error.message);

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Не удалось открыть «Клиенты»</h1>
      {needsMigration ? (
        <p className="text-sm text-gray-600">
          База на сервере не обновлена после последнего деплоя. На VPS выполните:
        </p>
      ) : (
        <p className="text-sm text-gray-600">Произошла ошибка при загрузке списка.</p>
      )}
      {needsMigration && (
        <pre className="text-left text-xs bg-slate-100 rounded-lg p-3 overflow-x-auto text-slate-700">
{`cd /opt/crm_atlantic
git pull origin main
docker compose exec -T postgres psql -U crm -d crm_atlantic \\
  < prisma/migrations/clients_v2.sql
docker compose build app && docker compose up -d --no-deps app`}
        </pre>
      )}
      <Button type="button" onClick={() => reset()}>
        Повторить
      </Button>
    </div>
  );
}
