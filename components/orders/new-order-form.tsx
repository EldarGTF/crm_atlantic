"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrderItemsEditor } from "./order-items-editor";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
  action: (state: unknown, formData: FormData) => Promise<unknown>;
  leadId: string;
};

export function NewOrderForm({ action, leadId }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<object[]>([]);
  const [extras, setExtras] = useState<object[]>([]);
  const [installation, setInstallation] = useState(true);
  const [installCost, setInstallCost] = useState(0);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const invalidItem = (items as { width: number; height: number; unitPrice: number }[])
      .find((i) => !i.width || !i.height || !i.unitPrice);
    if (invalidItem) {
      toast.error("Заполните ширину, высоту и цену для всех позиций");
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("items", JSON.stringify(items));
    fd.set("extras", JSON.stringify(extras));
    fd.set("installationIncluded", installation.toString());

    startTransition(async () => {
      const result = await action(undefined, fd) as { message?: string } | undefined;
      if (result?.message) toast.error(result.message);
    });
  }

  const itemsTotal = (items as { unitPrice: number; quantity: number }[])
    .reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const extrasTotal = (extras as { price: number }[]).reduce((s, e) => s + e.price, 0);
  const total = itemsTotal + extrasTotal + (installation ? installCost : 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <input type="hidden" name="leadId" value={leadId} />

      <OrderItemsEditor
        onChange={(its, exs) => { setItems(its); setExtras(exs); }}
      />

      {/* Монтаж */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="installationIncluded"
            checked={installation}
            onChange={(e) => setInstallation(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="installationIncluded" className="cursor-pointer">Включить монтаж</Label>
        </div>
        {installation && (
          <div className="space-y-1">
            <Label htmlFor="installationCost">Стоимость монтажа (₽)</Label>
            <Input
              id="installationCost"
              name="installationCost"
              type="number"
              value={installCost || ""}
              onChange={(e) => setInstallCost(Number(e.target.value))}
              placeholder="5000"
            />
          </div>
        )}
      </div>

      {/* Дедлайн производства */}
      <div className="space-y-1">
        <Label htmlFor="productionDeadline">Срок изготовления</Label>
        <Input id="productionDeadline" name="productionDeadline" type="date" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Примечания к заказу</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      {/* Итоговая сумма */}
      <div className="border-t pt-4 flex items-center justify-between">
        <div className="text-lg font-bold">
          Итого: <span className="text-blue-600">{total.toLocaleString("ru-RU")} ₽</span>
        </div>
        <Button type="submit" disabled={isPending || items.length === 0}>
          {isPending ? "Создание..." : "Создать заказ"}
        </Button>
      </div>
    </form>
  );
}
