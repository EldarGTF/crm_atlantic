"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTRACT_DRAFT_KEY, type ContractPayload } from "@/lib/contract-types";

type Props = {
  orderId: string;
  defaultValues: ContractPayload;
};

export function ContractForm({ orderId, defaultValues }: Props) {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const draft: ContractPayload = {
      contract_date: String(fd.get("contract_date") || ""),
      client_name: String(fd.get("client_name") || ""),
      client_iin: String(fd.get("client_iin") || ""),
      client_residence_address: String(fd.get("client_residence_address") || ""),
      installation_address: String(fd.get("installation_address") || ""),
      client_phone: String(fd.get("client_phone") || ""),
      work_items: defaultValues.work_items,
    };
    sessionStorage.setItem(CONTRACT_DRAFT_KEY(orderId), JSON.stringify(draft));
    router.push(`/orders/${orderId}/contract/works`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="contract_date">Дата договора</Label>
        <Input
          id="contract_date"
          name="contract_date"
          type="date"
          defaultValue={defaultValues.contract_date}
          className="h-10"
          required
        />
        <p className="text-xs text-slate-500">
          В документе: «06» января 2026 г. и 06.01.2026 в приложении
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="client_name">ФИО заказчика</Label>
        <Input
          id="client_name"
          name="client_name"
          defaultValue={defaultValues.client_name}
          className="h-10"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="client_iin">ИИН</Label>
        <Input
          id="client_iin"
          name="client_iin"
          defaultValue={defaultValues.client_iin}
          placeholder="12 цифр"
          className="h-10"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="client_phone">Телефон</Label>
        <Input
          id="client_phone"
          name="client_phone"
          type="tel"
          defaultValue={defaultValues.client_phone}
          className="h-10"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="client_residence_address">Адрес проживания</Label>
        <Input
          id="client_residence_address"
          name="client_residence_address"
          defaultValue={defaultValues.client_residence_address}
          className="h-10"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="installation_address">Адрес монтажа / объекта</Label>
        <Input
          id="installation_address"
          name="installation_address"
          defaultValue={defaultValues.installation_address}
          className="h-10"
          required
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit">Далее: таблица работ</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
