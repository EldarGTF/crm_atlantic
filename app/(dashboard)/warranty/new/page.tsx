import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewWarrantyClaimForm } from "@/components/orders/new-warranty-claim-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function NewWarrantyPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) redirect("/warranty");

  const { q } = await searchParams;

  const orders = q
    ? await prisma.order.findMany({
        where: {
          OR: [
            { lead: { client: { name: { contains: q, mode: "insensitive" } } } },
            { lead: { client: { phone: { contains: q } } } },
          ],
        },
        include: { lead: { include: { client: { select: { name: true, phone: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <Link href="/warranty" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
          <ChevronLeft className="h-4 w-4" /> Гарантия
        </Link>
        <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">Новое обращение</h1>
      </div>

      <NewWarrantyClaimForm orders={orders} initialQ={q} />
    </div>
  );
}
