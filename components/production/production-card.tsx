"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setProductionStatus } from "@/app/actions/production";
import { Calendar, ChevronRight, Package, Play, CheckCircle } from "lucide-react";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";

type Item = { productType: string; width: number; height: number; quantity: number };

type Order = {
  id: string;
  productionDeadline: Date | null;
  lead: {
    id: string;
    status: string;
    client: { name: string; phone: string };
  };
  items: Item[];
};

const STATUS_LABELS: Record<string, string> = {
  SENT_TO_PRODUCTION: "Ожидает",
  IN_PRODUCTION: "В работе",
  READY_FOR_INSTALLATION: "Готово",
};

const STATUS_COLORS: Record<string, string> = {
  SENT_TO_PRODUCTION: "bg-amber-100 text-amber-700 border-amber-200",
  IN_PRODUCTION: "bg-blue-100 text-blue-700 border-blue-200",
  READY_FOR_INSTALLATION: "bg-green-100 text-green-700 border-green-200",
};

function deadlineColor(date: Date | null, status: string) {
  if (!date || status === "READY_FOR_INSTALLATION") return "text-gray-500";
  if (isPast(date) && !isToday(date)) return "text-red-600";
  if (isToday(date)) return "text-amber-600";
  const days = differenceInDays(date, new Date());
  if (days <= 2) return "text-amber-500";
  return "text-gray-500";
}

export function ProductionCard({ order, role }: { order: Order; role: string }) {
  const [isPending, startTransition] = useTransition();
  const { lead } = order;
  const status = lead.status as keyof typeof STATUS_LABELS;
  const deadline = order.productionDeadline ? new Date(order.productionDeadline) : null;
  const dColor = deadlineColor(deadline, lead.status);

  function handleStatus(next: "IN_PRODUCTION" | "READY_FOR_INSTALLATION") {
    startTransition(() => setProductionStatus(lead.id, next));
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/orders/${order.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
              {lead.client.name}
            </Link>
            <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
          </div>
          <div className="text-sm text-gray-500">{lead.client.phone}</div>
        </div>
        <Link href={`/orders/${order.id}`} className="text-gray-400 hover:text-blue-600 shrink-0">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Позиции */}
      {order.items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-1 text-xs bg-gray-50 border rounded px-2 py-1">
              <Package className="h-3 w-3 text-gray-400" />
              {item.productType} {item.width}×{item.height}
              {item.quantity > 1 && <span className="text-gray-400">×{item.quantity}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Дедлайн */}
      {deadline && (
        <div className={`flex items-center gap-1.5 text-sm font-medium ${dColor}`}>
          <Calendar className="h-4 w-4" />
          Срок: {format(deadline, "d MMMM yyyy", { locale: ru })}
          {isPast(deadline) && !isToday(deadline) && lead.status !== "READY_FOR_INSTALLATION" && (
            <span className="text-xs font-normal">— просрочено на {differenceInDays(new Date(), deadline)} дн.</span>
          )}
          {isToday(deadline) && lead.status !== "READY_FOR_INSTALLATION" && (
            <span className="text-xs font-normal">— сегодня!</span>
          )}
        </div>
      )}

      {/* Кнопки — только для ADMIN */}
      <div className="flex gap-2 flex-wrap">
        {(role === "ADMIN" || role === "PRODUCTION") && status === "SENT_TO_PRODUCTION" && (
          <Button size="sm" disabled={isPending} onClick={() => handleStatus("IN_PRODUCTION")}>
            <Play className="h-3.5 w-3.5 mr-1" />
            {isPending ? "..." : "Взять в работу"}
          </Button>
        )}
        {(role === "ADMIN" || role === "PRODUCTION") && status === "IN_PRODUCTION" && (
          <Button size="sm" disabled={isPending} onClick={() => handleStatus("READY_FOR_INSTALLATION")}>
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            {isPending ? "..." : "Готово к монтажу"}
          </Button>
        )}
        {status === "READY_FOR_INSTALLATION" && (
          <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4" />
            Готово к монтажу
          </div>
        )}
      </div>
    </div>
  );
}
