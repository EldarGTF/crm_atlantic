"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signAct, archiveOrder } from "@/app/actions/orders";
import { toast } from "sonner";
import { FileCheck, Archive, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Props = {
  orderId: string;
  leadId: string;
  hasAct: boolean;
  hasDebt: boolean;
  actSignedAt: string | null;
};

export function OrderActions({ orderId, leadId, hasAct, hasDebt, actSignedAt }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSignAct() {
    startTransition(async () => {
      const result = await signAct(orderId, leadId) as { warning?: string } | undefined;
      if (result?.warning) {
        toast.warning(result.warning, { description: "Подтвердите оплату перед подписанием акта" });
      } else {
        toast.success("Акт выполненных работ подписан");
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveOrder(orderId, leadId);
    });
  }

  if (hasAct) {
    return (
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-600">
          <FileCheck className="h-5 w-5" />
          <span className="font-medium">Акт подписан</span>
          {actSignedAt && (
            <span className="text-sm text-gray-500">
              {format(new Date(actSignedAt), "d MMMM yyyy", { locale: ru })}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleArchive} disabled={isPending}>
          <Archive className="h-4 w-4 mr-1" />
          {isPending ? "..." : "Закрыть сделку и отправить в архив"}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-semibold text-gray-900">Завершение</h2>
      {hasDebt && (
        <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 rounded-lg p-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Есть задолженность. Акт можно подписать, но сделка останется с долгом.</span>
        </div>
      )}
      <Button onClick={handleSignAct} disabled={isPending}>
        <FileCheck className="h-4 w-4 mr-1" />
        {isPending ? "Сохранение..." : "Подписать акт выполненных работ"}
      </Button>
    </div>
  );
}
