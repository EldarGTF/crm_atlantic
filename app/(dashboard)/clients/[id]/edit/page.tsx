import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient, updateClient } from "@/app/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { ChevronLeft } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const action = updateClient.bind(null, id);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/clients/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> {client.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Редактировать клиента</h1>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <ClientForm action={action} client={client} />
      </div>
    </div>
  );
}
