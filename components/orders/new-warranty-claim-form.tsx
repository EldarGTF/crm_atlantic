"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWarrantyClaim } from "@/app/actions/warranty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Archive } from "lucide-react";
import { toast } from "sonner";

type Order = {
  id: string;
  archived: boolean;
  lead: { client: { name: string; phone: string } };
};

type Props = { orders: Order[]; initialQ?: string };

export function NewWarrantyClaimForm({ orders, initialQ }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [description, setDescription] = useState("");
  const [q, setQ] = useState(initialQ ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/warranty/new?q=${encodeURIComponent(q.trim())}`);
  }

  function handleSubmit() {
    if (!selectedOrder) { toast.error("Выберите заказ"); return; }
    if (!description.trim()) { toast.error("Опишите проблему"); return; }
    startTransition(async () => {
      await createWarrantyClaim(selectedOrder.id, description);
      toast.success("Обращение создано");
      router.push("/warranty");
    });
  }

  return (
    <div className="space-y-4">
      {/* Поиск заказа */}
      <div className="card p-4 space-y-3">
        <p className="text-sm font-medium text-slate-700">Найти заказ клиента</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Имя или телефон клиента..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">Найти</Button>
        </form>

        {orders.length > 0 && (
          <div className="divide-y border rounded-lg overflow-hidden">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrder(order)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between gap-3 ${
                  selectedOrder?.id === order.id
                    ? "bg-blue-50 border-l-2 border-l-blue-500"
                    : "hover:bg-slate-50"
                }`}
              >
                <div>
                  <span className="font-medium text-slate-900">{order.lead.client.name}</span>
                  <span className="text-slate-500 ml-2">{order.lead.client.phone}</span>
                </div>
                {order.archived && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                    <Archive className="h-3 w-3" /> Архив
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {initialQ && orders.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-3">Ничего не найдено</p>
        )}
      </div>

      {/* Описание проблемы */}
      {selectedOrder && (
        <div className="card p-4 space-y-3">
          <div className="text-sm text-slate-500">
            Клиент: <span className="font-medium text-slate-900">{selectedOrder.lead.client.name}</span>
            {selectedOrder.archived && <span className="ml-2 text-slate-400">(архивный заказ)</span>}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите проблему клиента..."
            rows={4}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Создание..." : "Создать обращение"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/warranty")}>Отмена</Button>
          </div>
        </div>
      )}
    </div>
  );
}
