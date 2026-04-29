"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Props = { action: (state: unknown, formData: FormData) => Promise<unknown> };

export function PaymentForm({ action }: Props) {
  const [, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-end">
      <div className="space-y-1">
        <Label className="text-xs">Тип</Label>
        <Select name="type" defaultValue="PREPAYMENT" items={{ PREPAYMENT: "Предоплата", FINAL: "Остаток", OTHER: "Другое" }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PREPAYMENT">Предоплата</SelectItem>
            <SelectItem value="FINAL">Остаток</SelectItem>
            <SelectItem value="OTHER">Другое</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Сумма (₸)</Label>
        <Input name="amount" type="number" min="1" placeholder="10000" className="w-32" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Примечание</Label>
        <Input name="notes" placeholder="Наличные, карта..." className="w-36" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "..." : "Добавить оплату"}
      </Button>
    </form>
  );
}
