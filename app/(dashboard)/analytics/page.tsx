import { getAnalytics } from "@/app/actions/analytics";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { Phone, TrendingUp, AlertCircle, Package, FileCheck, BarChart3 } from "lucide-react";

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: "Не оплачен",
  PREPAID: "Предоплата",
  PAID: "Оплачен",
};

const MONTH_NAMES = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session || !["ADMIN", "MANAGER", "ECONOMIST"].includes(session.role)) redirect("/dashboard");

  const data = await getAnalytics();
  const maxRevenue = Math.max(...data.revenueByMonth.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">Аналитика</h1>
        <p className="text-sm text-slate-500 mt-0.5">Финансовые показатели и статистика</p>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Выручка (12 мес.)</div>
          <div className="text-xl font-bold text-slate-900">{data.totalRevenue.toLocaleString("ru")} ₸</div>
        </div>
        <div className="card p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Общий долг</div>
          <div className="text-xl font-bold text-red-600">{data.totalDebt.toLocaleString("ru")} ₸</div>
        </div>
        <div className="card p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Конверсия</div>
          <div className="text-xl font-bold text-slate-900">{data.conversionRate.toFixed(1)}%</div>
          <div className="text-xs text-slate-400">{data.convertedLeads} из {data.totalLeads} заявок</div>
        </div>
        <div className="card p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Активных заказов</div>
          <div className="text-xl font-bold text-slate-900">{data.activeOrders}</div>
          <div className="text-xs text-slate-400">Подписано актов: {data.signedOrders}</div>
        </div>
      </div>

      {/* Выручка по месяцам */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Поступления по месяцам</h2>
        </div>
        <div className="flex items-end gap-1 h-32">
          {data.revenueByMonth.map(({ month, revenue }) => {
            const [year, m] = month.split("-");
            const label = MONTH_NAMES[parseInt(m, 10) - 1] + (m === "01" ? ` ${year}` : "");
            const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="w-full flex items-end justify-center" style={{ height: 96 }}>
                  <div
                    className="w-full rounded-t bg-blue-500 transition-all"
                    style={{ height: `${Math.max(height, revenue > 0 ? 4 : 0)}%` }}
                    title={`${revenue.toLocaleString("ru")} ₸`}
                  />
                </div>
                <span className="text-[9px] text-slate-400 truncate w-full text-center">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Статус оплат */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Статус оплат (активные заказы)</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="text-2xl font-bold text-red-600">{data.paymentBreakdown.UNPAID}</div>
            <div className="text-xs text-red-500 mt-0.5">Не оплачен</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div className="text-2xl font-bold text-amber-600">{data.paymentBreakdown.PREPAID}</div>
            <div className="text-xs text-amber-500 mt-0.5">Предоплата</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="text-2xl font-bold text-emerald-600">{data.paymentBreakdown.PAID}</div>
            <div className="text-xs text-emerald-500 mt-0.5">Оплачен</div>
          </div>
        </div>
      </div>

      {/* Должники */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <h2 className="font-semibold text-slate-900">Задолженность по клиентам</h2>
          <span className="text-xs text-slate-400 ml-auto">{data.debtOrders.length} клиентов</span>
        </div>
        {data.debtOrders.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Задолженности нет</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.debtOrders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between py-2.5 gap-3 hover:bg-slate-50 -mx-4 px-4 transition-colors">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 text-sm truncate">{o.clientName}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Phone className="h-3 w-3" />{o.clientPhone}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-red-600">{o.debt.toLocaleString("ru")} ₸</div>
                  <div className="text-xs text-slate-400">из {o.total.toLocaleString("ru")} ₸</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
