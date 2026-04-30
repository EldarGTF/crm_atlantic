"use client";

import { useState, useTransition } from "react";
import { updateWarrantyStatus } from "@/app/actions/warranty";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type Props = { claimId: string; orderId: string; currentStatus: string };

export function WarrantyStatusActions({ claimId, orderId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [resolution, setResolution] = useState("");
  const [showResolution, setShowResolution] = useState(false);

  function handle(status: "IN_PROGRESS" | "RESOLVED") {
    startTransition(async () => {
      await updateWarrantyStatus(claimId, orderId, status, resolution || undefined);
      toast.success(status === "RESOLVED" ? "Обращение закрыто" : "Статус обновлён");
      setShowResolution(false);
    });
  }

  return (
    <div className="space-y-2 pt-1 border-t border-slate-100">
      {showResolution && (
        <textarea
          placeholder="Комментарий к решению (необязательно)..."
          rows={2}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      )}
      <div className="flex gap-2 flex-wrap">
        {currentStatus === "OPEN" && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => handle("IN_PROGRESS")}>
            <Clock className="h-3.5 w-3.5 mr-1" /> Взять в работу
          </Button>
        )}
        {!showResolution ? (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => setShowResolution(true)}>
            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Закрыть
          </Button>
        ) : (
          <>
            <Button size="sm" disabled={isPending} onClick={() => handle("RESOLVED")}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> {isPending ? "Сохранение..." : "Подтвердить"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowResolution(false)}>Отмена</Button>
          </>
        )}
      </div>
    </div>
  );
}
