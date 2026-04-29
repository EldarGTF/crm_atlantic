import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/app/actions/orders";
import { NewOrderForm } from "@/components/orders/new-order-form";
import { ChevronLeft } from "lucide-react";

type Props = { searchParams: Promise<{ leadId?: string }> };

export default async function NewOrderPage({ searchParams }: Props) {
  const { leadId } = await searchParams;
  if (!leadId) notFound();

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { client: true },
  });
  if (!lead) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/leads/${leadId}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> {lead.client.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Новый заказ</h1>
        <p className="text-gray-500 text-sm mt-1">Клиент: {lead.client.name}</p>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <NewOrderForm action={createOrder} leadId={leadId} />
      </div>
    </div>
  );
}
