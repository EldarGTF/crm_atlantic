"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_LABELS = {
  REGULAR:   "Обычный",
  RETURNING: "Постоянный",
  VIP:       "VIP",
};

type Client = {
  id: string; name: string; phone: string;
  email: string | null; address: string | null;
  status: "REGULAR" | "RETURNING" | "VIP"; notes: string | null;
};

type Props = {
  action: (state: unknown, formData: FormData) => Promise<unknown>;
  client?: Client;
};

export function ClientForm({ action, client }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined) as [
    { errors?: Record<string, string[]> } | undefined,
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
          <Label className="text-sm font-medium text-slate-700">Статус клиента</Label>
          <Select name="status" defaultValue={client?.status ?? "REGULAR"} items={STATUS_LABELS}>
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Сохранение..." : client ? "Сохранить изменения" : "Создать клиента"}
      </Button>
    </form>
  );
}
