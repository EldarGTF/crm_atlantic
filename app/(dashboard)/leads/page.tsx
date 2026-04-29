import Link from "next/link";
import { getLeads } from "@/app/actions/leads";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Phone } from "lucide-react";
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, LEAD_STATUSES } from "@/lib/lead-constants";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function LeadsPage({ searchParams }: Props) {
  const { q, status } = await searchParams;
  const leads = await getLeads(q, status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">Заявки</h1>
          <p className="text-sm text-slate-500 mt-0.5">Новые сделки до создания заказа</p>
        </div>
        <LinkButton href="/leads/new">
          <Plus className="h-4 w-4 mr-1" /> Новая заявка
        </LinkButton>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 flex-wrap">
        <form className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input name="q" placeholder="Поиск..." defaultValue={q} className="pl-9 w-52" />
          {status && <input type="hidden" name="status" value={status} />}
        </form>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: "Все", value: "" },
            { label: "Новые", value: "NEW" },
            { label: "В работе", value: "IN_PROGRESS" },
            { label: "Замер назначен", value: "MEASUREMENT_SCHEDULED" },
            { label: "Замер выполнен", value: "MEASUREMENT_DONE" },
            { label: "КП отправлено", value: "QUOTE_SENT" },
            { label: "Согласовано", value: "AGREED" },
          ].map(({ label, value }) => (
            <Link
              key={label}
              href={value ? `/leads?status=${value}${q ? `&q=${q}` : ""}` : `/leads${q ? `?q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                (status ?? "") === value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {q || status ? "Ничего не найдено" : "Заявок пока нет"}
        </div>
      ) : (
        <div className="grid gap-2.5">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="card-hover p-4 block"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{lead.client.name}</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {LEAD_SOURCE_LABELS[lead.source]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {lead.client.phone}
                    </span>
                    <span>{lead.manager.name}</span>
                    {lead.description && (
                      <span className="truncate max-w-xs">{lead.description}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge className="text-xs">{LEAD_STATUS_LABELS[lead.status]}</Badge>
                  <span className="text-xs text-muted-foreground/70">
                    {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true, locale: ru })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
