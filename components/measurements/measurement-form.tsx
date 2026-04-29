"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Measurer = { id: string; name: string };

type Props = {
  action: (state: unknown, formData: FormData) => Promise<unknown>;
  leadId: string;
  defaultAddress?: string;
  measurers: Measurer[];
};

export function MeasurementForm({ action, leadId, defaultAddress = "", measurers }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined) as [
    { errors?: Record<string, string[]> } | undefined,
    (formData: FormData) => void,
    boolean,
  ];

  const minDate = new Date();
  minDate.setMinutes(0, 0, 0);
  const minStr = minDate.toISOString().slice(0, 16);

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <input type="hidden" name="leadId" value={leadId} />

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Замерщик *</Label>
        <Select name="measurerId" required items={Object.fromEntries(measurers.map((m) => [m.id, m.name]))}>
          <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
            <SelectValue placeholder="Выберите замерщика" />
          </SelectTrigger>
          <SelectContent>
            {measurers.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.measurerId && (
          <p className="text-xs text-red-500">{state.errors.measurerId[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Дата и время замера *</Label>
        <Input name="scheduledAt" type="datetime-local" min={minStr} required
          className="h-10 bg-slate-50 border-slate-200" />
        {state?.errors?.scheduledAt && (
          <p className="text-xs text-red-500">{state.errors.scheduledAt[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Адрес объекта *</Label>
        <Input name="address" defaultValue={defaultAddress} required
          placeholder="ул. Ленина, 12, кв. 34"
          className="h-10 bg-slate-50 border-slate-200" />
        {state?.errors?.address && (
          <p className="text-xs text-red-500">{state.errors.address[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Заметки</Label>
        <Textarea name="notes" rows={2}
          placeholder="Примечания для замерщика..."
          className="bg-slate-50 border-slate-200 resize-none" />
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Создание..." : "Назначить замер"}
      </Button>
    </form>
  );
}
