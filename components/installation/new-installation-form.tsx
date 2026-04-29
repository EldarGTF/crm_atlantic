"use client";

import { useActionState } from "react";
import { scheduleInstallation } from "@/app/actions/installation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

type Order = { id: string; lead: { client: { name: string } } };
type Installer = { id: string; name: string };

type Props = { orders: Order[]; installers: Installer[] };

export function NewInstallationForm({ orders, installers }: Props) {
  const [state, formAction, pending] = useActionState(scheduleInstallation, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {state.message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Заказ *</Label>
        <Select name="orderId" required items={Object.fromEntries(orders.map((o) => [o.id, o.lead.client.name]))}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите заказ" />
          </SelectTrigger>
          <SelectContent>
            {orders.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.lead.client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Монтажник *</Label>
        <Select name="installerId" required items={Object.fromEntries(installers.map((i) => [i.id, i.name]))}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите монтажника" />
          </SelectTrigger>
          <SelectContent>
            {installers.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Дата и время *</Label>
        <Input name="scheduledAt" type="datetime-local" required />
      </div>

      <div className="space-y-1.5">
        <Label>Адрес *</Label>
        <Input name="address" placeholder="ул. Ленина, 12, кв. 34" required />
      </div>

      <div className="space-y-1.5">
        <Label>Примечание</Label>
        <Textarea name="notes" placeholder="Особые условия, код домофона..." rows={3} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение..." : "Назначить монтаж"}
        </Button>
        <Link href="/installation">
          <Button variant="outline" type="button">Отмена</Button>
        </Link>
      </div>
    </form>
  );
}
