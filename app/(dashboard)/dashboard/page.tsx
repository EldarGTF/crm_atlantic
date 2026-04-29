import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats } from "@/app/actions/dashboard";
import { LEAD_STATUS_LABELS } from "@/lib/lead-constants";
import {
  FileText, Users, Package, CheckSquare, TrendingUp, TrendingDown,
  Wrench, HardHat, AlertTriangle, Calendar, ArrowRight,
} from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";

function GrowthBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{value}%
    </span>
  );
}

const PIPELINE_STAGES = [
  { key: "NEW", label: "Новые" },
  { key: "IN_PROGRESS", label: "В работе" },
  { key: "MEASUREMENT_SCHEDULED", label: "Замер" },
  { key: "MEASUREMENT_DONE", label: "Замер готов" },
  { key: "QUOTE_SENT", label: "КП отправлено" },
  { key: "AGREED", label: "Согласовано" },
  { key: "SENT_TO_PRODUCTION", label: "Производство" },
  { key: "IN_PRODUCTION", label: "В работе" },
  { key: "READY_FOR_INSTALLATION", label: "Готово" },
  { key: "INSTALLATION_SCHEDULED", label: "Монтаж" },
  { key: "INSTALLED", label: "Смонтировано" },
];

export default async function DashboardPage() {
  const [user, stats] = await Promise.all([getCurrentUser(), getDashboardStats()]);

  const pipelineTotal = PIPELINE_STAGES.reduce((s, st) => s + (stats.pipeline[st.key] ?? 0), 0);
  const maxPipeline = Math.max(...PIPELINE_STAGES.map((s) => stats.pipeline[s.key] ?? 0), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">Дашборд</h1>
        <p className="text-sm text-slate-500 mt-0.5">Добро пожаловать, {user?.name}</p>
      </div>

      {/* Главные метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Заявок в месяц",   value: stats.newLeadsMonth, growth: stats.leadsGrowth,  icon: FileText,   color: "#2563EB", bg: "#EFF6FF" },
          { label: "Выручка (месяц)",  value: stats.revenueNow > 0 ? `${(stats.revenueNow / 1000).toFixed(0)}к ₽` : "—", growth: stats.revenueGrowth, icon: TrendingUp, color: "#059669", bg: "#ECFDF5" },
          { label: "Активных заказов", value: stats.activeOrders,   icon: Package,    color: "#D97706", bg: "#FFFBEB" },
          { label: "Всего клиентов",   value: stats.clientsTotal,   icon: Users,      color: "#7C3AED", bg: "#F5F3FF" },
        ].map(({ label, value, growth, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-medium text-slate-500 leading-snug">{label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
            {growth !== undefined && <GrowthBadge value={growth ?? null} />}
          </div>
        ))}
      </div>

      {/* Предупреждения */}
      {(stats.overdueTasks > 0 || stats.todayTasks > 0 || stats.todayInstallations > 0 || stats.production > 0) && (
        <div className="flex flex-wrap gap-2">
          {stats.overdueTasks > 0 && (
            <Link href="/tasks" className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2 text-sm text-red-700 hover:bg-red-100 transition-colors font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Просрочено задач: {stats.overdueTasks}
            </Link>
          )}
          {stats.todayTasks > 0 && (
            <Link href="/tasks" className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors font-medium">
              <CheckSquare className="h-3.5 w-3.5 shrink-0" />
              Задач сегодня: {stats.todayTasks}
            </Link>
          )}
          {stats.todayInstallations > 0 && (
            <Link href="/installation" className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-2 text-sm text-blue-700 hover:bg-blue-100 transition-colors font-medium">
              <HardHat className="h-3.5 w-3.5 shrink-0" />
              Монтажей сегодня: {stats.todayInstallations}
            </Link>
          )}
          {stats.production > 0 && (
            <Link href="/production" className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-200 transition-colors font-medium">
              <Wrench className="h-3.5 w-3.5 shrink-0" />
              В производстве: {stats.production}
            </Link>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Воронка продаж */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Воронка продаж</h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">{pipelineTotal} активных</span>
          </div>
          <div className="space-y-3">
            {PIPELINE_STAGES.map(({ key, label }) => {
              const count = stats.pipeline[key] ?? 0;
              if (count === 0) return null;
              const pct = Math.round((count / maxPipeline) * 100);
              return (
                <Link key={key} href={`/leads?status=${key}`} className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
                  <span className="text-xs text-slate-500 w-24 sm:w-32 shrink-0 truncate">{LEAD_STATUS_LABELS[key]}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-5 text-right shrink-0">{count}</span>
                </Link>
              );
            })}
            {pipelineTotal === 0 && <p className="text-sm text-slate-400 py-4 text-center">Нет активных заявок</p>}
          </div>
        </div>

        {/* Последние заявки */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Последние заявки</h2>
            <Link href="/leads" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              Все <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentLeads.length === 0 && (
              <p className="text-sm text-slate-400 py-6 text-center">Заявок пока нет</p>
            )}
            {stats.recentLeads.map((lead) => (
              <Link key={lead.id} href={`/leads/${lead.id}`}
                className="flex items-center justify-between gap-3 py-3 hover:opacity-70 transition-opacity first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{lead.client.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{lead.manager.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500">{LEAD_STATUS_LABELS[lead.status]}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{format(new Date(lead.updatedAt), "d MMM", { locale: ru })}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Ближайшие монтажи */}
      {stats.upcomingInstallations.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Ближайшие монтажи</h2>
            <Link href="/installation" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              Все <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {stats.upcomingInstallations.map((inst) => {
              const d = new Date(inst.scheduledAt);
              const dayLabel = isToday(d) ? "Сегодня" : isTomorrow(d) ? "Завтра" : format(d, "d MMMM", { locale: ru });
              return (
                <Link key={inst.id} href={`/orders/${inst.order.id}`}
                  className="border border-slate-200 rounded-xl p-3.5 hover:border-blue-200 hover:bg-blue-50/40 transition-all"
                >
                  <div className="font-semibold text-sm text-slate-800">{inst.order.lead.client.name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                    <Calendar className="h-3 w-3" />
                    {dayLabel}, {format(d, "HH:mm")}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{inst.installer.name}</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
