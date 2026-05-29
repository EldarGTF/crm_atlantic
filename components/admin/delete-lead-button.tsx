"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteLead } from "@/app/actions/leads";
import { toast } from "sonner";

type Props = { leadId: string; hasOrder: boolean };

export function DeleteLeadButton({ leadId, hasOrder }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const extra = hasOrder
      ? " Вместе с заявкой будет удалён связанный заказ, замеры и файлы."
      : " Будут удалены замеры и история заявки.";
    if (!confirm(`Удалить заявку безвозвратно?${extra}`)) return;

    startTransition(async () => {
      const result = await deleteLead(leadId);
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
      {isPending ? "Удаление..." : "Удалить заявку"}
    </Button>
  );
}
