"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markInstallationDone } from "@/app/actions/installation";
import { Calendar, MapPin, User, CheckCircle, ChevronRight } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ru } from "date-fns/locale";

type Props = {
  installation: {
    id: string;
    scheduledAt: Date;
    doneAt: Date | null;
    address: string;
    notes: string | null;
    installer: { name: string };
    order: {
      id: string;
      leadId: string;
      lead: { id: string; client: { name: string; phone: string } };
    };
  };
  role: string;
};

export function InstallationCard({ installation: inst, role }: Props) {
  const [isPending, startTransition] = useTransition();
  const scheduled = new Date(inst.scheduledAt);
  const overdue = !inst.doneAt && isPast(scheduled) && !isToday(scheduled);
  const today = !inst.doneAt && isToday(scheduled);

  function handleDone() {
    startTransition(() =>
      markInstallationDone(inst.id, inst.order.id, inst.order.lead.id)
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/orders/${inst.order.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
              {inst.order.lead.client.name}
            </Link>
            {inst.doneAt ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" /> Выполнен
              </Badge>
            ) : overdue ? (
              <Badge className="bg-red-100 text-red-700 border-red-200">Просрочен</Badge>
            ) : today ? (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">Сегодня</Badge>
            ) : (
              <Badge variant="outline">Запланирован</Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">{inst.order.lead.client.phone}</div>
        </div>
        <Link href={`/orders/${inst.order.id}`} className="text-gray-400 hover:text-blue-600 shrink-0">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
        <span className={`flex items-center gap-1 font-medium ${overdue ? "text-red-600" : today ? "text-amber-600" : ""}`}>
          <Calendar className="h-3.5 w-3.5" />
          {format(scheduled, "d MMMM, HH:mm", { locale: ru })}
        </span>
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-gray-400" />
          {inst.installer.name}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          <span className="truncate max-w-xs">{inst.address}</span>
        </span>
      </div>

      {inst.notes && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded px-3 py-2">{inst.notes}</p>
      )}

      {!inst.doneAt && (role === "ADMIN" || role === "INSTALLER") && (
        <Button size="sm" onClick={handleDone} disabled={isPending}>
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          {isPending ? "..." : "Отметить выполненным"}
        </Button>
      )}
    </div>
  );
}
