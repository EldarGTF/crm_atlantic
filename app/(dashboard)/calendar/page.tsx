import Link from "next/link";
import { getCalendarEvents } from "@/app/actions/calendar";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { searchParams: Promise<{ month?: string }> };

const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export default async function CalendarPage({ searchParams }: Props) {
  const { month } = await searchParams;
  const anchor = month ? new Date(month) : new Date();
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const from = startOfWeek(monthStart, { weekStartsOn: 1 });
  const to = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const events = await getCalendarEvents(from, to);
  const prevMonth = subMonths(monthStart, 1).toISOString();
  const nextMonth = addMonths(monthStart, 1).toISOString();
  const todayHref = `/calendar?month=${new Date().toISOString()}`;

  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const key = format(e.start, "yyyy-MM-dd");
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }

  const days = eachDayOfInterval({ start: from, end: to });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthEventsCount = events.filter((e) => isSameMonth(e.start, monthStart)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">Календарь</h1>
          <p className="text-sm text-slate-500 mt-0.5">Замеры и монтажи</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={todayHref}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            Сегодня
          </Link>
          <Link
            href={`/calendar?month=${prevMonth}`}
            className="p-2 rounded-lg border bg-white hover:bg-slate-50"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-medium text-slate-700 min-w-[160px] text-center capitalize">
            {format(monthStart, "LLLL yyyy", { locale: ru })}
          </span>
          <Link
            href={`/calendar?month=${nextMonth}`}
            className="p-2 rounded-lg border bg-white hover:bg-slate-50"
            aria-label="Следующий месяц"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-violet-200 bg-violet-50" />
          Замер
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-amber-200 bg-amber-50" />
          Монтаж
        </span>
        {monthEventsCount === 0 && (
          <span className="text-slate-400">На этот месяц событий нет</span>
        )}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-slate-50">
          {WEEKDAYS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-xs font-semibold text-slate-500 uppercase"
            >
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = byDay.get(key) ?? [];
              const inMonth = isSameMonth(day, monthStart);
              const today = isToday(day);

              return (
                <div
                  key={key}
                  className={`min-h-[88px] sm:min-h-[100px] p-1.5 sm:p-2 border-r last:border-r-0 ${
                    inMonth ? "bg-white" : "bg-slate-50/80"
                  }`}
                >
                  <div
                    className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      today
                        ? "bg-blue-600 text-white"
                        : inMonth
                          ? "text-slate-700"
                          : "text-slate-300"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.map((e) => (
                      <Link
                        key={`${e.type}-${e.id}`}
                        href={e.href}
                        className={`block text-[10px] sm:text-xs rounded px-1.5 py-1 border leading-tight ${
                          e.done
                            ? "bg-slate-50 border-slate-200 text-slate-500 line-through"
                            : e.type === "measurement"
                              ? "bg-violet-50 border-violet-200 text-violet-800"
                              : "bg-amber-50 border-amber-200 text-amber-900"
                        }`}
                      >
                        <span className="font-medium">{format(e.start, "HH:mm")}</span>{" "}
                        <span className="truncate">{e.title.replace(/^(Замер|Монтаж) — /, "")}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
