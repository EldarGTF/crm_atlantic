import Link from "next/link";
import { getClients } from "@/app/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { Plus, Search, Phone, MapPin } from "lucide-react";
import { getSession } from "@/lib/session";

const STATUS_LABELS = { REGULAR: "Обычный", RETURNING: "Постоянный", VIP: "VIP" };
const STATUS_COLORS = {
  REGULAR: "secondary",
  RETURNING: "default",
  VIP: "destructive",
} as const;

type Props = { searchParams: Promise<{ q?: string }> };

export default async function ClientsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const [clients, session] = await Promise.all([getClients(q), getSession()]);
  const canEdit = session?.role !== "ECONOMIST";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Клиенты</h1>
        {canEdit && (
          <LinkButton href="/clients/new">
            <Plus className="h-4 w-4 mr-1" /> Новый клиент
          </LinkButton>
        )}
      </div>

      <form className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          name="q"
          placeholder="Поиск по имени, телефону..."
          defaultValue={q}
          className="pl-9"
        />
      </form>

      {clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {q ? "Ничего не найдено" : "Клиентов пока нет"}
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="bg-white rounded-lg border p-4 hover:border-blue-300 hover:shadow-sm transition-all block"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{client.name}</span>
                    <Badge variant={STATUS_COLORS[client.status]}>
                      {STATUS_LABELS[client.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {client.phone}
                    </span>
                    {client.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {client.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400 shrink-0">
                  <div>Заявок: {client._count.leads}</div>
                  <div>Заказов: {client._count.orders}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
