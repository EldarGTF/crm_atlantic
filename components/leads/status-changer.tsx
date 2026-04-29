"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "@/app/actions/leads";
import { LEAD_STATUS_LABELS } from "@/lib/lead-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STATUS_ORDER = [
  "NEW", "IN_PROGRESS", "MEASUREMENT_SCHEDULED", "MEASUREMENT_DONE",
  "QUOTE_SENT", "AGREED", "SENT_TO_PRODUCTION", "IN_PRODUCTION",
  "READY_FOR_INSTALLATION", "INSTALLATION_SCHEDULED", "INSTALLED",
  "ACT_SIGNED", "CLOSED", "CANCELLED",
];

type Props = { leadId: string; currentStatus: string };

export function StatusChanger({ leadId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateLeadStatus(leadId, status as never, note || undefined);
      setOpen(false);
      setNote("");
      toast.success("Статус обновлён");
    });
  }

  return (
    <div className="space-y-2">
      <Select value={status} onValueChange={(v: string | null) => { if (v) { setStatus(v); setOpen(v !== currentStatus); } }} items={LEAD_STATUS_LABELS}>
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {open && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
          <Textarea
            placeholder="Комментарий к смене статуса (необязательно)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? "Сохранение..." : "Сохранить"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setStatus(currentStatus); setOpen(false); setNote(""); }}
            >
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
