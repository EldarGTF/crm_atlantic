import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getContractPrefill } from "@/app/actions/contract";
import { ContractWorksForm } from "@/components/orders/contract-works-form";
import { formatOrderNumber } from "@/lib/order-number";

type Props = { params: Promise<{ id: string }> };

export default async function OrderContractWorksPage({ params }: Props) {
  const { id } = await params;
  const data = await getContractPrefill(id);
  if (!data) notFound();

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div>
        <Link
          href={`/orders/${id}/contract`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Договор — шаг 1
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Спецификация работ — заказ {formatOrderNumber(data.orderNumber)}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Шаг 2 из 2 — таблица для договора</p>
      </div>

      <ContractWorksForm orderId={id} />
    </div>
  );
}
