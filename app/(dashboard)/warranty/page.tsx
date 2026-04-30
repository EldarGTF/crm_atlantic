import { getAllWarrantyClaims } from "@/app/actions/warranty";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Phone, AlertCircle, Clock, CheckCircle, ShieldCheck, Archive } from "lucide-react";
import { WarrantyStatusActions } from "@/components/orders/warranty-status-actions";

type Props = { searchParams: Promise<{ status?: string }> };

const STATUS_CONFIG = {
  OPEN:        { label: "Открыто",  cls: "bg-red-50 text-red-700 border-red-200",       icon: AlertCircle },
  IN_PROGRESS: { label: "В работе", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  RESOLVED:    { label: "Решено",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
};

export default async function WarrantyPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session || !["ADMIN", "MANAGER", "ECONOMIST"].includes(session.role)) redirect("/dashboard");

  const { status } = await searchParams;
  const statusFilter = status === "OPEN" ? "OPEN" : status === "IN_PROGRESS" ? "IN_PROGRESS" : status === "RESOLVED" ? "RESOLVED" : undefined;
  const claims = await getAllWarrantyClaims(statusFilter);
  const canEdit = session.role !== "ECONOMIST";

  const tabs = [
    { label: "Активные",  value: undefined,      count: null },
    { label: "Открыто",   value: "OPEN",         count: null },
    { label: "В работе",  value: "IN_PROGRESS",  count: null },
    { label: "Решено",    value: "RESOLVED",     count: null },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900">Гарантийные обращения</h1>
        <p className="text-sm text-slate-500 mt-0.5">Все обращения по заказам, включая архивные</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ label, value }) => {
          const isActive = status === value || (!status && !value);
          const href = value ? `/warranty?status=${value}` : "/warranty";
          return (
            <Link key={label} href={href}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {claims.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <ShieldCheck className="h-10 w-10 opacity-30" />
          <p className="text-sm">Обращений нет</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {claims.map((claim) => {
            const cfg = STATUS_CONFIG[claim.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.OPEN;
            const Icon = cfg.icon;
            return (
              <div key={claim.id} className="card p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                    claim.status === "OPEN" ? "text-red-500" : claim.status === "IN_PROGRESS" ? "text-amber-500" : "text-emerald-500"
                  }`} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/orders/${claim.order.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                        {claim.order.lead.client.name}
                      </Link>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      {claim.order.archived && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                          <Archive className="h-3 w-3" /> Архив
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />{claim.order.lead.client.phone}
                      </span>
                      <span>{format(new Date(claim.createdAt), "d MMM yyyy", { locale: ru })}</span>
                    </div>
                    <p className="text-sm text-slate-700">{claim.description}</p>
                    {claim.resolution && (
                      <p className="text-sm text-emerald-700 bg-emerald-50 rounded px-2 py-1">
                        Решение: {claim.resolution}
                      </p>
                    )}
                  </div>
                  <Link href={`/orders/${claim.order.id}`} className="text-xs text-blue-600 hover:underline shrink-0">
                    Заказ →
                  </Link>
                </div>

                {canEdit && claim.status !== "RESOLVED" && (
                  <WarrantyStatusActions claimId={claim.id} orderId={claim.order.id} currentStatus={claim.status} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
