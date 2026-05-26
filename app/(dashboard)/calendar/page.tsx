import Link from "next/link";
import { getCalendarEvents } from "@/app/actions/calendar";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

type Props = { searchParams: Promise<{ week?: string }> };

export default async function CalendarPage({ searchParams }: Props) {
  const { week } = await searchParams;
  const anchor = week ? new Date(week) : new Date();
  const from = startOfWeek(anchor, { weekStartsOn: 1 });
  const to = endOfWeek(anchor, { weekStartsOn: 1 });

  const events = await getCalendarEvents(from, to);
  const prevWeek = subWeeks(from, 1).toISOString();
  const nextWeek = addWeeks(from, 1).toISOString();

  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const key = format(e.start, "yyyy-MM-dd");
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    days.push(d);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">Календарь</h1>
          <p className="text-sm text-slate-500 mt-0.5">Замеры и монтажи</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?week=${prevWeek}`}
            className="p-2 rounded-lg border bg-white hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-medium text-slate-700 min-w-[140px] text-center">
            {format(from, "d MMM", { locale: ru })} – {format(to, "d MMM yyyy", { locale: ru })}
          </span>
          <Link
            href={`/calendar?week=${nextWeek}`}
            className="p-2 rounded-lg border bg-white hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-lg border">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">На эту неделю событий нет</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = byDay.get(key) ?? [];
            return (
              <div key={key} className="bg-white rounded-lg border min-h-[120px] p-2">
                <div className="text-xs font-semibold text-slate-500 mb-2">
                  {format(day, "EEE d", { locale: ru })}
                </div>
                <div className="space-y-1.5">
                  {dayEvents.map((e) => (
                    <Link
                      key={`${e.type}-${e.id}`}
                      href={e.href}
                      className={`block text-xs rounded px-2 py-1.5 border ${
                        e.done
                          ? "bg-slate-50 border-slate-200 text-slate-500 line-through"
                          : e.type === "measurement"
                            ? "bg-violet-50 border-violet-200 text-violet-800"
                            : "bg-amber-50 border-amber-200 text-amber-900"
                      }`}
                    >
                      <div className="font-medium">{format(e.start, "HH:mm")}</div>
                      <div className="truncate">{e.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
