"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteClient } from "@/app/actions/clients";
import { toast } from "sonner";

type Props = {
  clientId: string;
  leadsCount: number;
  ordersCount: number;
};

export function DeleteClientButton({ clientId, leadsCount, ordersCount }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const parts: string[] = [];
    if (leadsCount > 0) parts.push(`${leadsCount} заявок`);
    if (ordersCount > 0) parts.push(`${ordersCount} заказов`);
    const extra = parts.length
      ? ` Будут удалены: ${parts.join(", ")}, замеры и файлы.`
      : "";
    if (!confirm(`Удалить клиента безвозвратно?${extra}`)) return;

    startTransition(async () => {
      const result = await deleteClient(clientId);
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
      {isPending ? "Удаление..." : "Удалить клиента"}
    </Button>
  );
}
