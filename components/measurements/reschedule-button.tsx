"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { rescheduleMeasurement } from "@/app/actions/measurements";
import { CalendarClock, X } from "lucide-react";
import { toast } from "sonner";

type Props = { measurementId: string; currentDate: string; currentAddress: string; role: string };

export function RescheduleMeasurementButton({ measurementId, currentDate, currentAddress, role }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(currentDate.slice(0, 16));
  const [address, setAddress] = useState(currentAddress);

  if (role !== "ADMIN" && role !== "MANAGER") return null;

  function handle() {
    if (!date) { toast.error("Укажите дату"); return; }
    startTransition(async () => {
      await rescheduleMeasurement(measurementId, date, address || undefined);
      toast.success("Дата замера перенесена");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CalendarClock className="h-3.5 w-3.5 mr-1" /> Перенести
      </Button>
    );
  }

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Перенести замер</p>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Адрес"
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handle} disabled={isPending}>
          {isPending ? "Сохранение..." : "Сохранить"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
      </div>
    </div>
  );
}
