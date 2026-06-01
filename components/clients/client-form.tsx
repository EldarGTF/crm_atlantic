"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLIENT_TEMPERATURE_LABELS } from "@/lib/client-constants";

import { CLIENT_STATUS_LABELS } from "@/lib/client-constants";

type Client = {
  id: string; name: string; phone: string;
  email: string | null; address: string | null;
  status: "PRIVATE" | "LEGAL" | "GOVERNMENT";
  temperature: "COLD" | "WARM" | "HOT";
  notes: string | null;
};

type Props = {
  action: (state: unknown, formData: FormData) => Promise<unknown>;
  client?: Client;
};

export function ClientForm({ action, client }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined) as [
    {
      errors?: Record<string, string[]>;
      duplicateWarning?: { id: string; name: string; phone: string }[];
      message?: string;
    } | undefined,
    (formData: FormData) => void,
    boolean,
  ];

  return (
    <form action={formAction} className="space-y-5 max-w-lg">

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">ФИО / Название *</Label>
          <Input name="name" defaultValue={client?.name}
            placeholder="Иванов Иван Иванович"
            className="h-10 bg-slate-50 border-slate-200" required />
          {state?.errors?.name && <p className="text-xs text-red-500">{state.errors.name[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Телефон *</Label>
          <Input name="phone" type="tel" defaultValue={client?.phone}
            placeholder="+7 999 123-45-67"
            className="h-10 bg-slate-50 border-slate-200" required />
          {state?.errors?.phone && <p className="text-xs text-red-500">{state.errors.phone[0]}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Email</Label>
          <Input name="email" type="email" defaultValue={client?.email ?? ""}
            placeholder="ivan@mail.ru"
            className="h-10 bg-slate-50 border-slate-200" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Тип клиента</Label>
          <Select name="status" defaultValue={client?.status ?? "PRIVATE"} items={CLIENT_STATUS_LABELS}>
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Готовность к сделке</Label>
        <Select
          name="temperature"
          defaultValue={client?.temperature ?? "COLD"}
          items={CLIENT_TEMPERATURE_LABELS}
        >
          <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CLIENT_TEMPERATURE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">
          Холодный — только интерес; тёплый — сравнивает; горячий — готов к замеру или заказу
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Адрес объекта</Label>
        <Input name="address" defaultValue={client?.address ?? ""}
          placeholder="ул. Ленина, 12, кв. 34"
          className="h-10 bg-slate-50 border-slate-200" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Заметки</Label>
        <Textarea name="notes" rows={3} defaultValue={client?.notes ?? ""}
          placeholder="Дополнительная информация о клиенте..."
          className="bg-slate-50 border-slate-200 resize-none" />
      </div>

      {state?.duplicateWarning && state.duplicateWarning.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-900">{state.message}</p>
          <ul className="text-sm text-amber-800 space-y-1">
            {state.duplicateWarning.map((d) => (
              <li key={d.id}>
                <a href={`/clients/${d.id}`} className="underline">
                  {d.name}
                </a>{" "}
                — {d.phone}
              </li>
            ))}
          </ul>
          <input type="hidden" name="forceDuplicate" value="1" />
          <Button type="submit" variant="outline" disabled={pending}>
            Создать всё равно
          </Button>
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Сохранение..." : client ? "Сохранить изменения" : "Создать клиента"}
      </Button>
    </form>
  );
}
