import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, signAct, archiveOrder } from "@/app/actions/orders";
import { addPayment } from "@/app/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, CheckCircle, Package, Wrench, HardHat, Calendar, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { PaymentForm } from "@/components/orders/payment-form";
import { OrderActions } from "@/components/orders/order-actions";
import { SendToProductionButton } from "@/components/orders/send-to-production-button";
import { FileUploader } from "@/components/file-uploader";
import { addOrderFile, deleteOrderFile } from "@/app/actions/orders-files";
import { getSession } from "@/lib/session";

const PAYMENT_STATUS = { UNPAID: "Не оплачен", PREPAID: "Предоплата", PAID: "Оплачен" };
const PAYMENT_STATUS_COLORS = { UNPAID: "destructive", PREPAID: "default", PAID: "secondary" } as const;
const PAYMENT_TYPE = { PREPAYMENT: "Предоплата", FINAL: "Остаток", OTHER: "Другое" };

type Props = { params: Promise<{ id: string }> };

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const session = await getSession();
  const role = session?.role ?? "MANAGER";
  const PRODUCTION_ROLES = new Set(["PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"]);
  const isProduction = PRODUCTION_ROLES.has(role);
  const isEconomist = role === "ECONOMIST";
  const canEdit = !isEconomist;

  // Файлы нарядов: каждый цех видит только свой наряд
  const WORK_ORDER_TYPES: Record<string, string> = {
    PRODUCTION_GLASS:    "WORK_ORDER_GLASS",
    PRODUCTION_PVC:      "WORK_ORDER_PVC",
    PRODUCTION_ALUMINUM: "WORK_ORDER_ALUMINUM",
  };
  const myWorkOrderType = WORK_ORDER_TYPES[role];
  const canSeeMaterials = !isProduction; // ADMIN, MANAGER, ECONOMIST видят перечень материалов

  const workOrderFiles = order.files.filter((f) =>
    myWorkOrderType
      ? (f.type as string) === myWorkOrderType
      : ["WORK_ORDER_GLASS", "WORK_ORDER_PVC", "WORK_ORDER_ALUMINUM"].includes(f.type as string)
  );
  const materialsFiles = order.files.filter((f) => (f.type as string) === "MATERIALS_LIST");
  const generalFiles = order.files.filter(
    (f) => !["WORK_ORDER_GLASS", "WORK_ORDER_PVC", "WORK_ORDER_ALUMINUM", "MATERIALS_LIST"].includes(f.type as string)
  );

  const paid = order.payments.reduce((s, p) => s + Number(p.amount), 0);
  const debt = Number(order.totalAmount) - paid;
  const addPaymentAction = addPayment.bind(null, id);
  const addFile = addOrderFile.bind(null, id, "DOCUMENT");

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link
          href={`/leads/${order.leadId}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> {order.lead.client.name}
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">Заказ</h1>
          <div className="flex items-center gap-2">
            <Badge variant={PAYMENT_STATUS_COLORS[order.paymentStatus]}>
              {PAYMENT_STATUS[order.paymentStatus]}
            </Badge>
            {order.act && <Badge variant="secondary">Акт подписан</Badge>}
          </div>
        </div>
      </div>

      {/* Спецификация */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Спецификация</h2>
        </div>
        <div className="divide-y">
          {order.items.map((item, idx) => (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {idx + 1}. {item.productType}
                    {item.profile && <span className="text-gray-500 ml-1">({item.profile})</span>}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {item.width} × {item.height} мм · кол-во: {item.quantity}
                    {item.config && <span className="ml-2">{item.config}</span>}
                  </div>
                </div>
                {!isProduction && (
                  <div className="text-sm font-medium text-right shrink-0">
                    <div>{Number(item.unitPrice).toLocaleString("ru-RU")} ₸/шт</div>
                    <div className="text-blue-600">{Number(item.totalPrice).toLocaleString("ru-RU")} ₸</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {order.extraWorks.length > 0 && (
          <>
            <div className="px-4 py-2 bg-gray-50 border-t">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Дополнительные работы</span>
            </div>
            {order.extraWorks.map((ew) => (
              <div key={ew.id} className="px-4 py-2 flex justify-between text-sm border-t">
                <span className="text-gray-700">{ew.name}</span>
                {!isProduction && <span className="font-medium">{Number(ew.price).toLocaleString("ru-RU")} ₸</span>}
              </div>
            ))}
          </>
        )}

        {!isProduction && order.installationIncluded && (
          <div className="px-4 py-2 flex justify-between text-sm border-t">
            <span className="flex items-center gap-1 text-gray-700">
              <Wrench className="h-3.5 w-3.5" /> Монтаж
            </span>
            <span className="font-medium">{Number(order.installationCost).toLocaleString("ru-RU")} ₸</span>
          </div>
        )}

        {!isProduction && (
          <div className="px-4 py-3 border-t bg-gray-50 flex justify-between font-semibold">
            <span>Итого</span>
            <span className="text-blue-600">{Number(order.totalAmount).toLocaleString("ru-RU")} ₸</span>
          </div>
        )}
      </div>

      {/* Срок изготовления */}
      {order.productionDeadline && (
        <div className="bg-white rounded-lg border p-4 text-sm">
          <span className="text-gray-500">Срок изготовления: </span>
          <span className="font-medium">
            {format(new Date(order.productionDeadline), "d MMMM yyyy", { locale: ru })}
          </span>
        </div>
      )}

      {/* Оплаты */}
      {!isProduction && (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-gray-900">Оплата</h2>
          </div>
          <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="text-gray-500">Сумма</div>
              <div className="font-bold text-base sm:text-lg">{Number(order.totalAmount).toLocaleString("ru-RU")} ₸</div>
            </div>
            <div>
              <div className="text-gray-500">Оплачено</div>
              <div className="font-bold text-base sm:text-lg text-green-600">{paid.toLocaleString("ru-RU")} ₸</div>
            </div>
            <div>
              <div className="text-gray-500">Долг</div>
              <div className={`font-bold text-base sm:text-lg ${debt > 0 ? "text-red-500" : "text-gray-400"}`}>
                {debt.toLocaleString("ru-RU")} ₸
              </div>
            </div>
          </div>

          {order.payments.length > 0 && (
            <div className="border-t divide-y">
              {order.payments.map((p) => (
                <div key={p.id} className="px-4 py-2 flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span>{PAYMENT_TYPE[p.type]}</span>
                    <span className="text-gray-400">
                      {format(new Date(p.paidAt), "d MMM yyyy", { locale: ru })}
                    </span>
                  </div>
                  <span className="font-medium">{Number(p.amount).toLocaleString("ru-RU")} ₸</span>
                </div>
              ))}
            </div>
          )}

          {!order.act && canEdit && (
            <div className="border-t p-4">
              <PaymentForm action={addPaymentAction} />
            </div>
          )}
        </div>
      )}

      {/* Производство */}
      {!isProduction && !isEconomist && !order.act && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Производство</h2>
          {order.productionDeadline && (
            <div className="text-sm text-gray-600">
              Срок изготовления:{" "}
              <span className="font-medium">
                {format(new Date(order.productionDeadline), "d MMMM yyyy", { locale: ru })}
              </span>
            </div>
          )}
          <SendToProductionButton
            orderId={id}
            leadId={order.leadId}
            leadStatus={order.lead.status}
          />
        </div>
      )}

      {/* Монтаж */}
      {!isProduction && (
        order.installation ? (
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <HardHat className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Монтаж</h2>
              {order.installation.doneAt ? (
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5">Выполнен</span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">Запланирован</span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {format(new Date(order.installation.scheduledAt), "d MMMM yyyy, HH:mm", { locale: ru })}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                {order.installation.installer.name}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {order.installation.address}
              </span>
            </div>
            {order.installation.notes && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded px-3 py-2">{order.installation.notes}</p>
            )}
            {order.installation.doneAt && (
              <p className="text-sm text-green-600">
                Выполнен: {format(new Date(order.installation.doneAt), "d MMMM yyyy", { locale: ru })}
              </p>
            )}
          </div>
        ) : (
          order.lead.status === "READY_FOR_INSTALLATION" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700 flex items-center justify-between gap-3">
              <span>Заказ готов к монтажу — монтаж ещё не назначен</span>
              <Link href="/installation/new" className="font-medium underline underline-offset-2 shrink-0">
                Назначить
              </Link>
            </div>
          )
        )
      )}

      {/* Наряды в цех */}
      {workOrderFiles.length > 0 && (() => {
        const WORK_ORDER_LABELS: Record<string, string> = {
          WORK_ORDER_GLASS:    "Наряд — Стекло",
          WORK_ORDER_PVC:      "Наряд — ПВХ",
          WORK_ORDER_ALUMINUM: "Наряд — Алюминий",
        };
        return (
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h2 className="font-semibold text-gray-900">Наряды в цех</h2>
            {workOrderFiles.map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-36 shrink-0">{WORK_ORDER_LABELS[f.type] ?? f.type}</span>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                  {f.name}
                </a>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Перечень материалов — только для ADMIN, MANAGER, ECONOMIST */}
      {canSeeMaterials && materialsFiles.length > 0 && (
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">Перечень материалов</h2>
          {materialsFiles.map((f) => (
            <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              {f.name}
            </a>
          ))}
        </div>
      )}

      {/* Прочие документы */}
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">Документы и файлы</h2>
        <FileUploader
          folder={`orders/${id}`}
          existingFiles={generalFiles}
          onUpload={canEdit ? addFile : undefined}
          onDelete={canEdit ? async (fileId) => { "use server"; await deleteOrderFile(fileId, id); } : undefined}
        />
      </div>

      {/* Действия */}
      {!isProduction && canEdit && (
        <OrderActions
          orderId={id}
          leadId={order.leadId}
          hasAct={!!order.act}
          hasDebt={debt > 0}
          actSignedAt={order.act ? order.act.signedAt.toISOString() : null}
        />
      )}
    </div>
  );
}
