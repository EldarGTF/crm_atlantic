import Link from "next/link";
import { getClients } from "@/app/actions/clients";
import { Badge } from "@/components/ui/badge";
import { ClientListSortSelect } from "@/components/clients/client-list-sort";
import { ClientTemperatureBadge } from "@/components/clients/client-temperature-badge";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import {
  CLIENT_LIST_SORTS,
  CLIENT_TEMPERATURE_LABELS,
  clientStatusBadgeVariant,
  clientStatusLabel,
  clientsListHref,
  type ClientListSort,
} from "@/lib/client-constants";
import { Plus, Search, Phone, MapPin } from "lucide-react";
import { getSession } from "@/lib/session";

type Props = {
  searchParams: Promise<{ q?: string; temperature?: string; sort?: string }>;
};

function parseSortParam(value?: string): ClientListSort {
  return CLIENT_LIST_SORTS.includes(value as ClientListSort)
    ? (value as ClientListSort)
    : "created_desc";
}

export default async function ClientsPage({ searchParams }: Props) {
  const { q, temperature, sort: sortParam } = await searchParams;
  const sort = parseSortParam(sortParam);
  const [clients, session] = await Promise.all([
    getClients(q, temperature, sort),
    getSession(),
  ]);
  const canEdit = session?.role !== "ECONOMIST";
  const hasFilters = Boolean(q || temperature || sort !== "created_desc");

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

      <div className="flex flex-col gap-3">
        <form className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            name="q"
            placeholder="Поиск по имени, телефону..."
            defaultValue={q}
            className="pl-9"
          />
          {temperature && <input type="hidden" name="temperature" value={temperature} />}
          {sort !== "created_desc" && <input type="hidden" name="sort" value={sort} />}
        </form>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: "Все", value: "" },
              ...Object.entries(CLIENT_TEMPERATURE_LABELS).map(([value, label]) => ({
                label,
                value,
              })),
            ].map(({ label, value }) => {
              const isActive = (temperature ?? "") === value;
              return (
                <Link
                  key={label}
                  href={clientsListHref({ q, temperature: value || undefined, sort })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <ClientListSortSelect sort={sort} q={q} temperature={temperature} />
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {hasFilters ? "Ничего не найдено" : "Клиентов пока нет"}
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
                    <ClientTemperatureBadge temperature={client.temperature} />
                    <Badge variant={clientStatusBadgeVariant(client.status)}>
                      {clientStatusLabel(client.status)}
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
