import { getProductionOrders } from "@/app/actions/production";
import { ProductionCard } from "@/components/production/production-card";
import { Package } from "lucide-react";
import { getSession } from "@/lib/session";

export default async function ProductionPage() {
  const [orders, session] = await Promise.all([getProductionOrders(), getSession()]);
  const role = session?.role ?? "MANAGER";

  const waiting = orders.filter((o) => o.lead.status === "SENT_TO_PRODUCTION");
  const inWork = orders.filter((o) => o.lead.status === "IN_PRODUCTION");
  const ready = orders.filter((o) => o.lead.status === "READY_FOR_INSTALLATION");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Производство</h1>
        <div className="flex gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Ожидают: {waiting.length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            В работе: {inWork.length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Готово: {ready.length}
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Нет заказов в производстве</p>
          <p className="text-sm mt-1">Заказы появятся здесь после отправки на производство</p>
        </div>
      ) : (
        <div className="space-y-6">
          {inWork.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                В работе — {inWork.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {inWork.map((order) => (
                  <ProductionCard key={order.id} order={order} role={role} />
                ))}
              </div>
            </section>
          )}

          {waiting.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Ожидают запуска — {waiting.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {waiting.map((order) => (
                  <ProductionCard key={order.id} order={order} role={role} />
                ))}
              </div>
            </section>
          )}

          {ready.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Готово к монтажу — {ready.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {ready.map((order) => (
                  <ProductionCard key={order.id} order={order} role={role} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
