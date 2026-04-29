import Link from "next/link";
import { getArchivedLeads } from "@/app/actions/leads";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Phone, User, FileCheck, XCircle, Archive } from "lucide-react";
import { LEAD_STATUS_LABELS } from "@/lib/lead-constants";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

const STATUS_COLORS: Record<string, string> = {
  CLOSED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  ACT_SIGNED: "bg-blue-100 text-blue-700 border-blue-200",
};

export default async function ArchivePage({ searchParams }: Props) {
  const { q, status } = await searchParams;
  const leads = await getArchivedLeads(q, status);

  const totalRevenue = leads.reduce((sum, l) => {
    return sum + (l.order ? Number(l.order.prepaidAmount) : 0);
  }, 0);

  const closedCount = leads.filter((l) => l.status === "CLOSED").length;
  const cancelledCount = leads.filter((l) => l.status === "CANCELLED").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Архив</h1>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{leads.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Всего сделок</div>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{closedCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Закрыто</div>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-red-500">{cancelledCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Отказов</div>
        </div>
      </div>

      {totalRevenue > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          Выручка по архивным сделкам:{" "}
          <span className="font-semibold">{totalRevenue.toLocaleString("ru")} ₽</span>
        </div>
      )}

      {/* Фильтры */}
      <div className="flex flex-col gap-2">
        <form className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input name="q" placeholder="Поиск по имени или телефону..." defaultValue={q} className="pl-9 w-full sm:w-72" />
          {status && <input type="hidden" name="status" value={status} />}
        </form>
        <div className="flex gap-1 flex-wrap items-center">
          {[
            { label: "Все", value: undefined },
            { label: "Закрытые", value: "CLOSED" },
            { label: "Отказы", value: "CANCELLED" },
          ].map(({ label, value }) => (
            <Link
              key={label}
              href={value ? `/archive?status=${value}${q ? `&q=${q}` : ""}` : `/archive${q ? `?q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                status === value || (!status && !value)
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{q || status ? "Ничего не найдено" : "Архив пуст"}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => {
            const total = lead.order ? Number(lead.order.totalAmount) : 0;
            const paid = lead.order ? Number(lead.order.prepaidAmount) : 0;
            const debt = total - paid;
            const actDate = lead.order?.act?.signedAt;

            return (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="bg-white rounded-lg border p-4 hover:border-blue-300 hover:shadow-sm transition-all block"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{lead.client.name}</span>
                      <Badge className={STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-600"}>
                        {lead.status === "CLOSED" ? (
                          <><FileCheck className="h-3 w-3 mr-1" />{LEAD_STATUS_LABELS[lead.status]}</>
                        ) : lead.status === "CANCELLED" ? (
                          <><XCircle className="h-3 w-3 mr-1" />{LEAD_STATUS_LABELS[lead.status]}</>
                        ) : (
                          LEAD_STATUS_LABELS[lead.status]
                        )}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {lead.client.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {lead.manager.name}
                      </span>
                      {total > 0 && (
                        <span className="font-medium text-gray-700">
                          {total.toLocaleString("ru")} ₽
                          {debt > 0 && (
                            <span className="text-red-500 ml-1">(долг {debt.toLocaleString("ru")} ₽)</span>
                          )}
                        </span>
                      )}
                    </div>
                    {actDate && (
                      <div className="text-xs text-gray-400">
                        Акт подписан: {format(new Date(actDate), "d MMMM yyyy", { locale: ru })}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">
                    {format(new Date(lead.updatedAt), "d MMM yyyy", { locale: ru })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
