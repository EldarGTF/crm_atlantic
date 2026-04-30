import { getTodayData } from "@/app/actions/today";
import { TaskCard } from "@/components/tasks/task-card";
import { format, isPast, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { Calendar, Phone, MapPin, User, CheckCircle, Clock, AlertCircle, Ruler, HardHat, CheckSquare } from "lucide-react";

function EmptySection({ label }: { label: string }) {
  return <p className="text-sm text-slate-400 py-4 text-center">{label}</p>;
}

function SectionHeader({ icon: Icon, title, count, href, color }: {
  icon: React.ElementType; title: string; count: number; href: string; color: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          count > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"
        }`}>{count}</span>
      </div>
      <Link href={href} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
        Все →
      </Link>
    </div>
  );
}

export default async function TodayPage() {
  const { measurements, installations, tasks, role } = await getTodayData();

  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "ECONOMIST";
  const showMeasurements = isAdmin || role === "MEASURER";
  const showInstallations = isAdmin || role === "INSTALLER";

  const overdueTasks = tasks.filter((t) => {
    const due = t.dueAt ? new Date(t.dueAt) : null;
    return due && isPast(due) && !isToday(due);
  });
  const todayTasks = tasks.filter((t) => {
    const due = t.dueAt ? new Date(t.dueAt) : null;
    return due && isToday(due);
  });

  const totalItems = measurements.length + installations.length + tasks.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">Сегодня</h1>
        <p className="text-sm text-slate-500 mt-0.5 capitalize">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: ru })}
        </p>
      </div>

      {totalItems === 0 && (
        <div className="card flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <CheckCircle className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">На сегодня всё спокойно</p>
        </div>
      )}

      {/* Замеры */}
      {showMeasurements && (
        <div className="card p-4">
          <SectionHeader icon={Ruler} title="Замеры" count={measurements.length} href="/measurements" color="text-violet-500" />
          {measurements.length === 0 ? (
            <EmptySection label="Замеров на сегодня нет" />
          ) : (
            <div className="space-y-2">
              {measurements.map((m) => {
                const done = !!m.doneAt;
                const inWork = !!m.inWorkAt && !done;
                return (
                  <Link
                    key={m.id}
                    href={`/measurements/${m.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${done ? "bg-emerald-400" : inWork ? "bg-amber-400" : "bg-slate-300"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 text-sm">{m.lead.client.name}</span>
                        {done && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Выполнен</span>}
                        {inWork && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">В работе</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(m.scheduledAt), "HH:mm")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{m.lead.client.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />{m.measurer.name}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />{m.address}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Монтажи */}
      {showInstallations && (
        <div className="card p-4">
          <SectionHeader icon={HardHat} title="Монтажи" count={installations.length} href="/installation" color="text-blue-500" />
          {installations.length === 0 ? (
            <EmptySection label="Монтажей на сегодня нет" />
          ) : (
            <div className="space-y-2">
              {installations.map((inst) => {
                const done = !!inst.doneAt;
                const inWork = !!inst.inWorkAt && !done;
                return (
                  <Link
                    key={inst.id}
                    href={`/orders/${inst.order.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${done ? "bg-emerald-400" : inWork ? "bg-amber-400" : "bg-slate-300"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 text-sm">{inst.order.lead.client.name}</span>
                        {done && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Выполнен</span>}
                        {inWork && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">В работе</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(inst.scheduledAt), "HH:mm")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{inst.order.lead.client.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />{inst.installer.name}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />{inst.address}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Задачи */}
      <div className="card p-4">
        <SectionHeader icon={CheckSquare} title="Задачи" count={tasks.length} href="/tasks" color="text-slate-500" />

        {tasks.length === 0 ? (
          <EmptySection label="Задач на сегодня нет" />
        ) : (
          <div className="space-y-3">
            {overdueTasks.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span className="text-xs font-semibold text-red-700">Просрочено: {overdueTasks.length}</span>
              </div>
            )}
            {[...overdueTasks, ...todayTasks].map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
