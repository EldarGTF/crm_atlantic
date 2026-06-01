import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getContractPrefill } from "@/app/actions/contract";
import { ContractForm } from "@/components/orders/contract-form";
import { formatOrderNumber } from "@/lib/order-number";

type Props = { params: Promise<{ id: string }> };

export default async function OrderContractPage({ params }: Props) {
  const { id } = await params;
  const data = await getContractPrefill(id);
  if (!data) notFound();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link
          href={`/orders/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Заказ {formatOrderNumber(data.orderNumber)}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Договор подряда</h1>
        <p className="text-sm text-slate-500 mt-1">Шаг 1 из 2 — данные заказчика</p>
      </div>

      <ContractForm orderId={id} defaultValues={data.prefill} />
    </div>
  );
}
