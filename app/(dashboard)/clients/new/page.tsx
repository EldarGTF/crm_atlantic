import Link from "next/link";
import { createClient } from "@/app/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { ChevronLeft } from "lucide-react";

export default function NewClientPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/clients"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Клиенты
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Новый клиент</h1>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <ClientForm action={createClient} />
      </div>
    </div>
  );
}
