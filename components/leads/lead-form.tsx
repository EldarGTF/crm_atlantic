"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAD_SOURCE_LABELS } from "@/lib/lead-constants";

type Client = { id: string; name: string; phone: string };

type Props = {
  action: (state: unknown, formData: FormData) => Promise<unknown>;
  clients: Client[];
  defaultClientId?: string;
};

export function LeadForm({ action, clients, defaultClientId }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined) as [
    { errors?: Record<string, string[]> } | undefined,
    (formData: FormData) => void,
    boolean,
  ];

  return (
    <form action={formAction} className="space-y-5 max-w-lg">

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Клиент *</Label>
        <Select
          name="clientId"
          defaultValue={defaultClientId}
          required
          items={Object.fromEntries(clients.map((c) => [c.id, c.name]))}
        >
          <SelectTrigger className="h-10 bg-slate-50 border-slate-200 w-full">
            <SelectValue placeholder="Выберите клиента" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id} label={c.name}>
                {c.phone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.clientId && (
          <p className="text-xs text-red-500">{state.errors.clientId[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Источник</Label>
        <Select name="source" defaultValue="CALL" items={LEAD_SOURCE_LABELS}>
          <SelectTrigger className="h-10 bg-slate-50 border-slate-200 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Описание / Примечание</Label>
        <Textarea
          name="description"
          rows={3}
          placeholder="Что хочет клиент, тип конструкции, особые пожелания..."
          className="bg-slate-50 border-slate-200 resize-none"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Создание..." : "Создать заявку"}
      </Button>
    </form>
  );
}
