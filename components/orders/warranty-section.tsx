"use client";

import { useState, useTransition } from "react";
import { createWarrantyClaim, updateWarrantyStatus, deleteWarrantyClaim } from "@/app/actions/warranty";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, X, CheckCircle, Clock, AlertCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Claim = {
  id: string;
  description: string;
  status: string;
  resolvedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
};

const STATUS_CONFIG = {
  OPEN:        { label: "Открыто",    cls: "bg-red-50 text-red-700 border-red-200",     icon: AlertCircle },
  IN_PROGRESS: { label: "В работе",   cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  RESOLVED:    { label: "Решено",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
};

type Props = { orderId: string; claims: Claim[]; canEdit: boolean };

export function WarrantySection({ orderId, claims, canEdit }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});

  function handleCreate() {
    if (!description.trim()) { toast.error("Опишите проблему"); return; }
    startTransition(async () => {
      await createWarrantyClaim(orderId, description);
      setDescription("");
      setShowForm(false);
      toast.success("Обращение создано");
    });
  }

  function handleStatus(claimId: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED") {
    startTransition(async () => {
      await updateWarrantyStatus(claimId, orderId, status, resolutionText[claimId]);
      toast.success(status === "RESOLVED" ? "Обращение закрыто" : "Статус обновлён");
    });
  }

  function handleDelete(claimId: string) {
    if (!confirm("Удалить обращение?")) return;
    startTransition(async () => {
      await deleteWarrantyClaim(claimId, orderId);
      toast.success("Удалено");
    });
  }

  const openCount = claims.filter((c) => c.status !== "RESOLVED").length;

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Гарантийные обращения</h2>
          {openCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {openCount} открыто
            </span>
          )}
        </div>
        {canEdit && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Новое обращение
          </Button>
        )}
      </div>

      {showForm && (
        <div className="p-4 border-b bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Описание проблемы</p>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите проблему клиента..."
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={isPending}>
              {isPending ? "Сохранение..." : "Создать"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </div>
      )}

      {claims.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Обращений нет</p>
      ) : (
        <div className="divide-y">
          {claims.map((claim) => {
            const cfg = STATUS_CONFIG[claim.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.OPEN;
            const Icon = cfg.icon;
            const expanded = expandedId === claim.id;

            return (
              <div key={claim.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${claim.status === "OPEN" ? "text-red-500" : claim.status === "IN_PROGRESS" ? "text-amber-500" : "text-emerald-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(claim.createdAt), "d MMM yyyy", { locale: ru })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1">{claim.description}</p>
                    {claim.resolution && (
                      <p className="text-sm text-emerald-700 mt-1 bg-emerald-50 rounded px-2 py-1">
                        Решение: {claim.resolution}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && claim.status !== "RESOLVED" && (
                      <button
                        onClick={() => setExpandedId(expanded ? null : claim.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => handleDelete(claim.id)} disabled={isPending} className="text-gray-300 hover:text-red-500 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {canEdit && expanded && claim.status !== "RESOLVED" && (
                  <div className="ml-7 space-y-2">
                    <textarea
                      placeholder="Комментарий к решению (необязательно)..."
                      rows={2}
                      value={resolutionText[claim.id] ?? ""}
                      onChange={(e) => setResolutionText((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {claim.status === "OPEN" && (
                        <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleStatus(claim.id, "IN_PROGRESS")}>
                          <Clock className="h-3.5 w-3.5 mr-1" /> Взять в работу
                        </Button>
                      )}
                      <Button size="sm" disabled={isPending} onClick={() => handleStatus(claim.id, "RESOLVED")}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Закрыть как решённое
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
