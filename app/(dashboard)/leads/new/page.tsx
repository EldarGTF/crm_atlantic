import Link from "next/link";
import { createLead, getClientsForSelect } from "@/app/actions/leads";
import { LeadForm } from "@/components/leads/lead-form";
import { ChevronLeft } from "lucide-react";

type Props = { searchParams: Promise<{ clientId?: string }> };

export default async function NewLeadPage({ searchParams }: Props) {
  const { clientId } = await searchParams;
  const clients = await getClientsForSelect();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/leads"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Заявки
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Новая заявка</h1>
      </div>
      <div className="bg-white rounded-lg border p-6">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-3">Нет клиентов в базе</p>
            <Link href="/clients/new" className="text-blue-600 hover:underline">
              Создать клиента →
            </Link>
          </div>
        ) : (
          <LeadForm action={createLead} clients={clients} defaultClientId={clientId} />
        )}
      </div>
    </div>
  );
}
