import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/app/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LinkButton } from "@/components/ui/link-button";
import { ChevronLeft, Phone, Mail, MapPin, Plus, Pencil } from "lucide-react";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/lead-constants";

const STATUS_LABELS = { REGULAR: "Обычный", RETURNING: "Постоянный", VIP: "VIP" };
const STATUS_COLORS = { REGULAR: "secondary", RETURNING: "default", VIP: "destructive" } as const;

type Props = { params: Promise<{ id: string }> };

export default async function ClientPage({ params }: Props) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link
          href="/clients"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Клиенты
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <Badge variant={STATUS_COLORS[client.status]}>{STATUS_LABELS[client.status]}</Badge>
          </div>
          <LinkButton href={`/clients/${id}/edit`} variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Редактировать
          </LinkButton>
        </div>
      </div>

      {/* Контакты */}
      <div className="bg-white rounded-lg border p-4 space-y-2">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Контакты</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Phone className="h-4 w-4 text-gray-400" />
            <a href={`tel:${client.phone}`} className="hover:text-blue-600">{client.phone}</a>
          </div>
          {client.email && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-400" />
              <a href={`mailto:${client.email}`} className="hover:text-blue-600">{client.email}</a>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{client.address}</span>
            </div>
          )}
        </div>
        {client.notes && (
          <>
            <Separator />
            <p className="text-sm text-gray-600">{client.notes}</p>
          </>
        )}
      </div>

      {/* Заявки */}
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-900">Заявки ({client.leads.length})</h2>
          <LinkButton href={`/leads/new?clientId=${id}`} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" /> Новая заявка
          </LinkButton>
        </div>
        {client.leads.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 py-6 text-center">Заявок нет</p>
        ) : (
          <div className="divide-y">
            {client.leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm">
                  <span className="text-gray-500 mr-2">{lead.manager.name}</span>
                  {lead.description && (
                    <span className="text-gray-700 truncate">{lead.description}</span>
                  )}
                </div>
                <Badge variant={LEAD_STATUS_COLORS[lead.status] as "default"}>
                  {LEAD_STATUS_LABELS[lead.status]}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
