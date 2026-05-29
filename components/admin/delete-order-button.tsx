"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteOrder } from "@/app/actions/orders";
import { toast } from "sonner";

type Props = { orderId: string };

export function DeleteOrderButton({ orderId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        "Удалить заказ безвозвратно? Будут удалены оплаты, файлы и монтаж. Заявка останется в системе."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      <Trash2 className="h-4 w-4 mr-1" />
      {isPending ? "Удаление..." : "Удалить заказ"}
    </Button>
  );
}
