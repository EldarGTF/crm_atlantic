"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { takeInWorkDept, markDeptDone } from "@/app/actions/production";
import { Calendar, ChevronRight, Package, Play, CheckCircle, Clock } from "lucide-react";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";

type DeptRecord = {
  dept: string;
  inWorkAt: Date | null;
  doneAt: Date | null;
};

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
  productionDepts: DeptRecord[];
};

const DEPT_LABELS: Record<string, string> = {
  GLASS:    "Стекло",
  PVC:      "ПВХ",
  ALUMINUM: "Алюминий",
};

const DEPT_COLORS: Record<string, string> = {
  GLASS:    "bg-cyan-50 border-cyan-200 text-cyan-700",
  PVC:      "bg-violet-50 border-violet-200 text-violet-700",
  ALUMINUM: "bg-orange-50 border-orange-200 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
  SENT_TO_PRODUCTION:     "bg-amber-100 text-amber-700 border-amber-200",
  IN_PRODUCTION:          "bg-blue-100 text-blue-700 border-blue-200",
  READY_FOR_INSTALLATION: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  SENT_TO_PRODUCTION:     "Ожидает",
  IN_PRODUCTION:          "В работе",
  READY_FOR_INSTALLATION: "Готово",
};

function deadlineColor(date: Date | null, status: string) {
  if (!date || status === "READY_FOR_INSTALLATION") return "text-gray-500";
  if (isPast(date) && !isToday(date)) return "text-red-600";
  if (isToday(date)) return "text-amber-600";
  if (differenceInDays(date, new Date()) <= 2) return "text-amber-500";
  return "text-gray-500";
}

const DEPT_ROLE: Record<string, string> = {
  GLASS:    "PRODUCTION_GLASS",
  PVC:      "PRODUCTION_PVC",
  ALUMINUM: "PRODUCTION_ALUMINUM",
};

function canOperateDept(role: string, dept: string) {
  return role === "ADMIN" || role === "PRODUCTION" || DEPT_ROLE[dept] === role;
}

function DeptRow({ dept, orderId, role }: { dept: DeptRecord; orderId: string; role: string }) {
  const [isPending, startTransition] = useTransition();
  const canOperate = canOperateDept(role, dept.dept);

  return (
    <div className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${DEPT_COLORS[dept.dept] ?? ""}`}>
      <span className="text-xs font-semibold">{DEPT_LABELS[dept.dept] ?? dept.dept}</span>

      {dept.doneAt ? (
        <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
          <CheckCircle className="h-3.5 w-3.5" />
          Готово
        </span>
      ) : dept.inWorkAt ? (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-blue-700 font-medium">
            <Clock className="h-3.5 w-3.5" />
            В работе
          </span>
          {canOperate && (
            <Button
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={isPending}
              onClick={() => startTransition(() => markDeptDone(orderId, dept.dept))}
            >
              {isPending ? "..." : "Готово"}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Ожидает</span>
          {canOperate && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              disabled={isPending}
              onClick={() => startTransition(() => takeInWorkDept(orderId, dept.dept))}
            >
              <Play className="h-3 w-3 mr-0.5" />
              {isPending ? "..." : "В работу"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ProductionCard({ order, role }: { order: Order; role: string }) {
  const { lead } = order;
  const status = lead.status;
  const deadline = order.productionDeadline ? new Date(order.productionDeadline) : null;
  const dColor = deadlineColor(deadline, status);

  const visibleDepts =
    role === "ADMIN" || role === "PRODUCTION"
      ? order.productionDepts
      : order.productionDepts.filter((d) => DEPT_ROLE[d.dept] === role);

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/orders/${order.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
              {lead.client.name}
            </Link>
            <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status] ?? status}</Badge>
          </div>
          <div className="text-sm text-gray-500">{lead.client.phone}</div>
        </div>
        <Link href={`/orders/${order.id}`} className="text-gray-400 hover:text-blue-600 shrink-0">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

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

      {deadline && (
        <div className={`flex items-center gap-1.5 text-sm font-medium ${dColor}`}>
          <Calendar className="h-4 w-4" />
          Срок: {format(deadline, "d MMMM yyyy", { locale: ru })}
          {isPast(deadline) && !isToday(deadline) && status !== "READY_FOR_INSTALLATION" && (
            <span className="text-xs font-normal">— просрочено на {differenceInDays(new Date(), deadline)} дн.</span>
          )}
          {isToday(deadline) && status !== "READY_FOR_INSTALLATION" && (
            <span className="text-xs font-normal">— сегодня!</span>
          )}
        </div>
      )}

      {visibleDepts.length > 0 && (
        <div className="space-y-1.5">
          {visibleDepts.map((d) => (
            <DeptRow key={d.dept} dept={d} orderId={order.id} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}
