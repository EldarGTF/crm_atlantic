"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendToProduction } from "@/app/actions/orders";
import { Wrench } from "lucide-react";

const PRODUCTION_STATUSES = new Set([
  "SENT_TO_PRODUCTION", "IN_PRODUCTION", "READY_FOR_INSTALLATION",
  "INSTALLATION_SCHEDULED", "INSTALLED", "ACT_SIGNED", "CLOSED", "CANCELLED",
]);

const DEPTS = [
  { value: "GLASS",    label: "Стекло" },
  { value: "PVC",      label: "ПВХ" },
  { value: "ALUMINUM", label: "Алюминий" },
];

type Props = { orderId: string; leadId: string; leadStatus: string };

export function SendToProductionButton({ orderId, leadId, leadStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(["GLASS", "PVC", "ALUMINUM"]);
  const [error, setError] = useState<string | null>(null);

  if (PRODUCTION_STATUSES.has(leadStatus)) return null;

  function toggle(dept: string) {
    setSelected((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  }

  function handle() {
    if (!selected.length) {
      setError("Выберите хотя бы один цех");
      return;
    }
    setError(null);
    startTransition(() => sendToProduction(orderId, leadId, selected));
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Wrench className="h-4 w-4 mr-1" />
        Отправить в производство
      </Button>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <p className="text-sm font-medium text-gray-700">Выберите цехи:</p>
      <div className="flex flex-wrap gap-2">
        {DEPTS.map((d) => {
          const checked = selected.includes(d.value);
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              className={[
                "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                checked
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400",
              ].join(" ")}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handle} disabled={isPending}>
          <Wrench className="h-3.5 w-3.5 mr-1" />
          {isPending ? "..." : "Отправить"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
