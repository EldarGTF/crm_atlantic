"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signAct, archiveOrder } from "@/app/actions/orders";
import { toast } from "sonner";
import {
  FileCheck, Archive, AlertTriangle, Upload, Camera, CheckCircle, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type UploadedFile = { name: string; url: string; size: number };

type Props = {
  orderId: string;
  leadId: string;
  hasAct: boolean;
  hasDebt: boolean;
  actSignedAt: string | null;
};

export function OrderActions({ orderId, leadId, hasAct, hasDebt, actSignedAt }: Props) {
  const [isPending, startTransition] = useTransition();
  const [actFile, setActFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function handleActFile(file: File | null | undefined) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Файл больше 20 МБ"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", `orders/${orderId}/act`);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) { toast.error("Ошибка загрузки"); setUploading(false); return; }
    const data = await res.json();
    setActFile({ name: data.name, url: data.url, size: data.size });
    toast.success("Акт загружен");
    setUploading(false);
  }

  function handleSignAct() {
    if (!actFile) { toast.error("Загрузите файл акта выполненных работ"); return; }
    startTransition(async () => {
      const result = await signAct(orderId, leadId, actFile) as { warning?: string } | undefined;
      if (result?.warning) {
        toast.warning(result.warning, { description: "Подтвердите оплату перед подписанием акта" });
      } else {
        toast.success("Акт выполненных работ подписан");
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveOrder(orderId, leadId);
    });
  }

  if (hasAct) {
    return (
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-600">
          <FileCheck className="h-5 w-5" />
          <span className="font-medium">Акт подписан</span>
          {actSignedAt && (
            <span className="text-sm text-gray-500">
              {format(new Date(actSignedAt), "d MMMM yyyy", { locale: ru })}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleArchive} disabled={isPending}>
          <Archive className="h-4 w-4 mr-1" />
          {isPending ? "..." : "Закрыть сделку и отправить в архив"}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <h2 className="font-semibold text-gray-900">Завершение</h2>

      {hasDebt && (
        <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 rounded-lg p-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Есть задолженность. Акт можно подписать, но сделка останется с долгом.</span>
        </div>
      )}

      {/* Загрузка акта */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Акт выполненных работ <span className="text-red-500">*</span>
        </p>
        {actFile ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{actFile.name}</span>
            <button
              type="button"
              onClick={() => setActFile(null)}
              className="ml-auto text-gray-400 hover:text-red-500 shrink-0"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              Загрузить файл
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-1" /> Камера
            </Button>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
          onChange={(e) => handleActFile(e.target.files?.[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => handleActFile(e.target.files?.[0])} />
      </div>

      <Button onClick={handleSignAct} disabled={isPending || !actFile || uploading}>
        <FileCheck className="h-4 w-4 mr-1" />
        {isPending ? "Сохранение..." : "Подписать акт выполненных работ"}
      </Button>
      {!actFile && (
        <p className="text-xs text-red-500">Необходимо загрузить файл акта</p>
      )}
    </div>
  );
}
