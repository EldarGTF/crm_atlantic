import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead } from "@/app/actions/leads";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LinkButton } from "@/components/ui/link-button";
import { StatusChanger } from "@/components/leads/status-changer";
import { ChevronLeft, Phone, MapPin, Plus, Calendar, Clock, CheckSquare, AlertCircle } from "lucide-react";
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "@/lib/lead-constants";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getSession } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export default async function LeadPage({ params }: Props) {
  const { id } = await params;
  const [lead, session] = await Promise.all([getLead(id), getSession()]);
  if (!lead) notFound();
  const canEdit = session?.role !== "ECONOMIST";

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link
          href="/leads"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Заявки
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.client.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${lead.client.phone}`} className="hover:text-blue-600">
                  {lead.client.phone}
                </a>
              </span>
              {lead.client.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {lead.client.address}
                </span>
              )}
              <Badge variant="outline">{LEAD_SOURCE_LABELS[lead.source]}</Badge>
            </div>
          </div>
          <LinkButton href={`/clients/${lead.clientId}`} variant="outline" size="sm">
            Карточка клиента
          </LinkButton>
        </div>
      </div>

      {/* Статус */}
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Статус</h2>
          <span className="text-xs text-gray-400">
            Менеджер: {lead.manager.name}
          </span>
        </div>
        {canEdit ? (
          <StatusChanger leadId={lead.id} currentStatus={lead.status} />
        ) : (
          <Badge className="text-sm">{LEAD_STATUS_LABELS[lead.status]}</Badge>
        )}
        {lead.description && (
          <>
            <Separator />
            <p className="text-sm text-gray-600">{lead.description}</p>
          </>
        )}
      </div>

      {/* История статусов */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-900">История</h2>
        </div>
        <div className="divide-y">
          {lead.statusHistory.map((h) => (
            <div key={h.id} className="px-4 py-3 flex items-start gap-3">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {LEAD_STATUS_LABELS[h.status]}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {format(new Date(h.createdAt), "d MMM yyyy, HH:mm", { locale: ru })}
                  </span>
                  {h.user && (
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {h.user.name}
                    </span>
                  )}
                </div>
                {h.note && <p className="text-sm text-gray-600 mt-1">{h.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Замеры */}
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-900">
            Замеры ({lead.measurements.length})
          </h2>
          {canEdit && (
            <LinkButton href={`/measurements/new?leadId=${lead.id}`} size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> Назначить замер
            </LinkButton>
          )}
        </div>
        {lead.measurements.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 py-6 text-center">Замеров нет</p>
        ) : (
          <div className="divide-y">
            {lead.measurements.map((m) => (
              <Link
                key={m.id}
                href={`/measurements/${m.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-medium">
                      {format(new Date(m.scheduledAt), "d MMM yyyy, HH:mm", { locale: ru })}
                    </span>
                  </div>
                  <div className="text-gray-500 mt-0.5">
                    {m.measurer.name} · {m.address}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.files.length > 0 && (
                    <span className="text-xs text-gray-400">{m.files.length} фото</span>
                  )}
                  <Badge variant={m.doneAt ? "secondary" : "default"}>
                    {m.doneAt ? "Выполнен" : "Запланирован"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Задачи */}
      {lead.tasks.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Активные задачи ({lead.tasks.length})</h2>
            </div>
            {canEdit && (
              <LinkButton href={`/tasks/new`} size="sm" variant="outline">
                <Plus className="h-3.5 w-3.5 mr-1" /> Добавить
              </LinkButton>
            )}
          </div>
          <div className="divide-y">
            {lead.tasks.map((task) => {
              const overdue = task.dueAt && new Date(task.dueAt) < new Date();
              return (
                <div key={task.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="text-sm min-w-0">
                    <div className="font-medium text-gray-900 truncate">{task.title}</div>
                    {task.dueAt && (
                      <div className={`flex items-center gap-1 mt-0.5 text-xs ${overdue ? "text-red-600" : "text-gray-400"}`}>
                        {overdue && <AlertCircle className="h-3 w-3" />}
                        До {format(new Date(task.dueAt), "d MMM", { locale: ru })}
                        {overdue && " — просрочено"}
                      </div>
                    )}
                  </div>
                  <Badge variant={task.status === "IN_PROGRESS" ? "default" : "outline"} className="shrink-0 text-xs">
                    {task.status === "IN_PROGRESS" ? "В работе" : "Ожидает"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Заказ */}
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-900">Заказ</h2>
          {!lead.order && canEdit && (
            <LinkButton href={`/orders/new?leadId=${lead.id}`} size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> Создать заказ
            </LinkButton>
          )}
        </div>
        {!lead.order ? (
          <p className="text-sm text-gray-400 px-4 py-6 text-center">Заказ не создан</p>
        ) : (
          <div className="px-4 py-3">
            <Link
              href={`/orders/${lead.order.id}`}
              className="flex items-center justify-between hover:text-blue-600 transition-colors"
            >
              <div className="text-sm">
                <span className="font-medium">
                  {lead.order.items.length} позиций ·{" "}
                  {Number(lead.order.totalAmount).toLocaleString("ru-RU")} ₸
                </span>
              </div>
              <Badge variant={lead.order.act ? "secondary" : "default"}>
                {lead.order.act ? "Акт подписан" : "Активен"}
              </Badge>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
