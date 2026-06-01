"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateContract } from "@/app/actions/contract";
import {
  CONTRACT_DRAFT_KEY,
  DEFAULT_WORK_ITEM,
  type ContractPayload,
  type ContractWorkItem,
} from "@/lib/contract-types";
import { calcWorkSum } from "@/lib/contract-format";
import { toast } from "sonner";

type Props = { orderId: string };

export function ContractWorksForm({ orderId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [base, setBase] = useState<Omit<ContractPayload, "work_items"> | null>(null);
  const [rows, setRows] = useState<ContractWorkItem[]>([{ ...DEFAULT_WORK_ITEM }]);

  useEffect(() => {
    const raw = sessionStorage.getItem(CONTRACT_DRAFT_KEY(orderId));
    if (!raw) {
      router.replace(`/orders/${orderId}/contract`);
      return;
    }
    try {
      const draft = JSON.parse(raw) as ContractPayload;
      setBase({
        contract_date: draft.contract_date,
        client_name: draft.client_name,
        client_iin: draft.client_iin,
        client_residence_address: draft.client_residence_address,
        installation_address: draft.installation_address,
        client_phone: draft.client_phone,
      });
      if (draft.work_items?.length) setRows(draft.work_items);
    } catch {
      router.replace(`/orders/${orderId}/contract`);
    }
  }, [orderId, router]);

  function updateRow(index: number, field: keyof ContractWorkItem, value: string) {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      if (field === "work_qty" || field === "work_unit_price") {
        row.work_sum = calcWorkSum(
          field === "work_qty" ? value : row.work_qty,
          field === "work_unit_price" ? value : row.work_unit_price,
        );
      }
      next[index] = row;
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, { ...DEFAULT_WORK_ITEM }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function onGenerate() {
    if (!base) return;
    const payload: ContractPayload = { ...base, work_items: rows };
    sessionStorage.setItem(CONTRACT_DRAFT_KEY(orderId), JSON.stringify(payload));
    startTransition(async () => {
      const result = await generateContract(orderId, payload);
      if (result?.error) toast.error(result.error);
    });
  }

  if (!base) {
    return <p className="text-sm text-slate-500">Загрузка…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Заказчик: <span className="font-medium text-slate-900">{base.client_name}</span>
      </p>

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b text-left">
              <th className="p-2 w-8">№</th>
              <th className="p-2 min-w-[140px]">Наименование работ</th>
              <th className="p-2 w-16">Ед.</th>
              <th className="p-2 w-16">Кол-во</th>
              <th className="p-2 w-24">Цена</th>
              <th className="p-2 w-24">Сумма</th>
              <th className="p-2 min-w-[120px]">Срок</th>
              <th className="p-2 min-w-[160px]">Оплата</th>
              <th className="p-2 w-20">Гарантия</th>
              <th className="p-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b align-top">
                <td className="p-2 text-slate-500">{index + 1}</td>
                <td className="p-2">
                  <Input
                    value={row.work_name}
                    onChange={(e) => updateRow(index, "work_name", e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Наименование"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={row.work_unit}
                    onChange={(e) => updateRow(index, "work_unit", e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={row.work_qty}
                    onChange={(e) => updateRow(index, "work_qty", e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={row.work_unit_price}
                    onChange={(e) => updateRow(index, "work_unit_price", e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={row.work_sum}
                    onChange={(e) => updateRow(index, "work_sum", e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={row.work_deadline}
                    onChange={(e) => updateRow(index, "work_deadline", e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={row.work_payment_terms}
                    onChange={(e) => updateRow(index, "work_payment_terms", e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={row.work_warranty}
                    onChange={(e) => updateRow(index, "work_warranty", e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={rows.length <= 1}
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-4 w-4 mr-1" /> Добавить строку
      </Button>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="button" disabled={pending} onClick={onGenerate}>
          {pending ? "Формирование…" : "Сформировать и сохранить"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push(`/orders/${orderId}/contract`)}
        >
          Назад
        </Button>
      </div>
    </div>
  );
}
