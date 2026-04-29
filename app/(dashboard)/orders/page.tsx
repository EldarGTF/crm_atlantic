import Link from "next/link";
import { getOrders } from "@/app/actions/orders";
import { format, isPast, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import { Phone, Calendar, AlertCircle, FileCheck, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getSession } from "@/lib/session";

// Этапы пайплайна заказа по порядку
const STAGES = [
  { key: "AGREED",                   label: "Заказ" },
  { key: "SENT_TO_PRODUCTION",       label: "Производство" },
  { key: "IN_PRODUCTION",            label: "Изготовление" },
  { key: "READY_FOR_INSTALLATION",   label: "Готов" },
  { key: "INSTALLATION_SCHEDULED",   label: "Монтаж" },
  { key: "INSTALLED",                label: "Смонтирован" },
  { key: "ACT_SIGNED",               label: "Акт" },
];

const STAGE_INDEX: Record<string, number> = Object.fromEntries(
  STAGES.map((s, i) => [s.key, i])
);

const PAYMENT_CONFIG = {
  UNPAID:   { label: "Не оплачен",  cls: "bg-red-50 text-red-600 border-red-200" },
  PREPAID:  { label: "Предоплата",  cls: "bg-amber-50 text-amber-600 border-amber-200" },
  PAID:     { label: "Оплачен",     cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
} as const;

type Props = { searchParams: Promise<{ filter?: string; q?: string; payment?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  const { filter, q, payment } = await searchParams;
  const [session] = await Promise.all([getSession()]);
  const role = session?.role ?? "MANAGER";
  const canExport = role === "ADMIN" || role === "MANAGER" || role === "ECONOMIST";

  const archived = filter === "archive";
  const orders = await getOrders(archived, q, payment);

  const active  = orders.filter((o) => !o.act && !o.archived);
  const signed  = orders.filter((o) => !!o.act && !o.archived);
  const list    = filter === "signed" ? signed : filter === "archive" ? orders : active;

  const tabFilters = [
    { label: "В работе",     value: undefined,  count: active.length },
    { label: "Акт подписан", value: "signed",   count: signed.length },
    { label: "Архив",        value: "archive",  count: null },
  ];

  const paymentFilters = [
    { label: "Все",         value: undefined },
    { label: "Не оплачен",  value: "UNPAID" },
    { label: "Предоплата",  value: "PREPAID" },
    { label: "Оплачен",     value: "PAID" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">Заказы</h1>
          <p className="text-sm text-slate-500 mt-0.5">Все сделки с созданным заказом</p>
        </div>
        {canExport && (
          <a
            href={`/api/export/orders?${new URLSearchParams({ ...(q ? { q } : {}), ...(payment ? { payment } : {}), ...(filter === "archive" ? { archived: "1" } : {}) }).toString()}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ↓ Excel
          </a>
        )}
      </div>

      {/* Поиск */}
      <form className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          name="q"
          placeholder="Поиск по клиенту, телефону..."
          defaultValue={q}
          className="pl-9"
        />
        {filter && <input type="hidden" name="filter" value={filter} />}
        {payment && <input type="hidden" name="payment" value={payment} />}
      </form>

      {/* Табы + фильтр оплаты */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          {tabFilters.map(({ label, value, count }) => {
            const isActive = filter === value || (!filter && !value);
            const href = value
              ? `/orders?filter=${value}${q ? `&q=${q}` : ""}${payment ? `&payment=${payment}` : ""}`
              : `/orders${q ? `?q=${q}` : ""}${payment ? `${q ? "&" : "?"}payment=${payment}` : ""}`;
            return (
              <Link key={label} href={href}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                {label}
                {count !== null && <span className={`ml-1.5 text-xs font-semibold ${isActive ? "opacity-75" : "text-slate-400"}`}>{count}</span>}
              </Link>
            );
          })}
        </div>
        {!archived && (
          <div className="flex gap-1.5 flex-wrap">
            {paymentFilters.map(({ label, value }) => {
              const isActive = payment === value || (!payment && !value);
              const href = value
                ? `/orders?${filter ? `filter=${filter}&` : ""}payment=${value}${q ? `&q=${q}` : ""}`
                : `/orders${filter ? `?filter=${filter}` : ""}${q ? `${filter ? "&" : "?"}q=${q}` : ""}`;
              return (
                <Link key={label} href={href}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${isActive ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-slate-400">
          <Package className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Заказов нет</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((order) => {
            const paid    = order.payments.reduce((s, p) => s + Number(p.amount), 0);
            const total   = Number(order.totalAmount);
            const debt    = total - paid;
            const status  = order.lead.status;
            const stageIdx = STAGE_INDEX[status] ?? 0;
            const deadline = order.productionDeadline ? new Date(order.productionDeadline) : null;
            const deadlineOverdue = deadline && isPast(deadline) && !isToday(deadline) && !order.act;
            const deadlineToday   = deadline && isToday(deadline) && !order.act;
            const payment = PAYMENT_CONFIG[order.paymentStatus as keyof typeof PAYMENT_CONFIG];

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="card-hover block p-4"
              >
                {/* Верхняя строка */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{order.lead.client.name}</span>
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${payment.cls}`}>
                        {payment.label}
                      </span>
                      {order.act && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <FileCheck className="h-3 w-3" /> Акт подписан
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />{order.lead.client.phone}
                      </span>
                      <span className="font-medium text-slate-700">{total.toLocaleString("ru")} ₸</span>
                      {debt > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          долг {debt.toLocaleString("ru")} ₸
                        </span>
                      )}
                      {deadline && (
                        <span className={`flex items-center gap-1 ${deadlineOverdue ? "text-red-500" : deadlineToday ? "text-amber-500" : "text-slate-400"}`}>
                          <Calendar className="h-3 w-3" />
                          {format(deadline, "d MMM", { locale: ru })}
                          {deadlineOverdue && " — просрочено"}
                          {deadlineToday && " — сегодня"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {format(new Date(order.createdAt), "d MMM yyyy", { locale: ru })}
                  </span>
                </div>

                {/* Прогресс-бар этапов */}
                {!archived && (
                  <>
                    {/* Mobile: current stage badge + mini bar */}
                    <div className="sm:hidden mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">Этап {stageIdx + 1}/{STAGES.length}:</span>
                        <span className="text-xs font-semibold text-blue-600">{STAGES[stageIdx]?.label}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {STAGES.map((stage, i) => (
                          <div
                            key={stage.key}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i < stageIdx ? "bg-blue-500" :
                              i === stageIdx ? "bg-blue-300" :
                              "bg-slate-100"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Desktop: full bar with labels */}
                    <div className="hidden sm:flex items-center gap-0">
                      {STAGES.map((stage, i) => {
                        const done    = i < stageIdx;
                        const current = i === stageIdx;
                        const isLast  = i === STAGES.length - 1;
                        return (
                          <div key={stage.key} className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center flex-1 min-w-0">
                              <div className={`w-full h-1.5 rounded-full transition-colors ${
                                done    ? "bg-blue-500" :
                                current ? "bg-blue-300" :
                                          "bg-slate-100"
                              }`} />
                              <span className={`text-[9px] mt-1 font-medium truncate w-full text-center leading-tight ${
                                current ? "text-blue-600" :
                                done    ? "text-slate-400" :
                                          "text-slate-300"
                              }`}>
                                {stage.label}
                              </span>
                            </div>
                            {!isLast && <div className="w-0.5 h-1.5 bg-transparent shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
