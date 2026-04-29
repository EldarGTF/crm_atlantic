import Link from "next/link";
import { getMeasurements } from "@/app/actions/measurements";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, User, CheckCircle, Clock } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ru } from "date-fns/locale";

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function MeasurementsPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const measurements = await getMeasurements();

  const pending = measurements.filter((m) => !m.doneAt);
  const done = measurements.filter((m) => m.doneAt);
  const list = filter === "done" ? done : filter === "pending" ? pending : measurements;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Замеры</h1>
        <LinkButton href="/measurements/new">
          <Plus className="h-4 w-4 mr-1" /> Новый замер
        </LinkButton>
      </div>

      <div className="flex gap-2">
        {[
          { label: "Все", value: undefined },
          { label: `Ожидают (${pending.length})`, value: "pending" },
          { label: `Выполнены (${done.length})`, value: "done" },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={value ? `/measurements?filter=${value}` : "/measurements"}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === value || (!filter && !value)
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Замеров нет</div>
      ) : (
        <div className="grid gap-3">
          {list.map((m) => {
            const scheduled = new Date(m.scheduledAt);
            const overdue = !m.doneAt && isPast(scheduled) && !isToday(scheduled);
            const today = !m.doneAt && isToday(scheduled);

            return (
              <Link
                key={m.id}
                href={`/measurements/${m.id}`}
                className="bg-white rounded-lg border p-4 hover:border-blue-300 hover:shadow-sm transition-all block"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{m.lead.client.name}</span>
                      {m.doneAt ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Выполнен
                        </Badge>
                      ) : m.inWorkAt ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" /> В работе
                        </Badge>
                      ) : overdue ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          <Clock className="h-3 w-3 mr-1" /> Просрочен
                        </Badge>
                      ) : today ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          <Clock className="h-3 w-3 mr-1" /> Сегодня
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" /> Запланирован
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(scheduled, "d MMMM, HH:mm", { locale: ru })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate max-w-xs">{m.address}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {m.measurer.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {m.lead.client.phone}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
