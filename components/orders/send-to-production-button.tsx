"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendToProduction } from "@/app/actions/orders";
import { Wrench, Upload, Camera, CheckCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const PRODUCTION_STATUSES = new Set([
  "SENT_TO_PRODUCTION", "IN_PRODUCTION", "READY_FOR_INSTALLATION",
  "INSTALLATION_SCHEDULED", "INSTALLED", "ACT_SIGNED", "CLOSED", "CANCELLED",
]);

const DEPTS = [
  { value: "GLASS",    label: "Стекло",    fileType: "WORK_ORDER_GLASS" },
  { value: "PVC",      label: "ПВХ",       fileType: "WORK_ORDER_PVC" },
  { value: "ALUMINUM", label: "Алюминий",  fileType: "WORK_ORDER_ALUMINUM" },
];

type UploadedFile = { type: string; name: string; url: string; size: number };

type Props = { orderId: string; leadId: string; leadStatus: string };

function InlineUpload({
  label,
  fileType,
  orderId,
  onUploaded,
}: {
  label: string;
  fileType: string;
  orderId: string;
  onUploaded: (f: UploadedFile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ name: string } | null>(null);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Файл больше 20 МБ"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", `orders/${orderId}`);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) { toast.error("Ошибка загрузки"); setUploading(false); return; }
    const data = await res.json();
    setUploaded({ name: data.name });
    onUploaded({ type: fileType, name: data.name, url: data.url, size: data.size });
    setUploading(false);
  }

  return (
    <div className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
      <div className="text-sm min-w-0">
        <span className="font-medium text-gray-700">{label}</span>
        {uploaded && (
          <span className="ml-2 text-xs text-green-600 flex items-center gap-1 inline-flex">
            <CheckCircle className="h-3 w-3" /> {uploaded.name}
          </span>
        )}
        {!uploaded && <span className="ml-2 text-xs text-red-500">обязательно</span>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600"
          title="Загрузить файл"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => cameraRef.current?.click()}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600"
          title="Камера"
        >
          <Camera className="h-4 w-4" />
        </button>
        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
    </div>
  );
}

export function SendToProductionButton({ orderId, leadId, leadStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(["GLASS", "PVC", "ALUMINUM"]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  if (PRODUCTION_STATUSES.has(leadStatus)) return null;

  function toggle(dept: string) {
    setSelected((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
    // remove uploaded file for this dept if deselected
    const fileType = DEPTS.find((d) => d.value === dept)?.fileType;
    if (fileType) {
      setUploadedFiles((prev) => prev.filter((f) => f.type !== fileType));
    }
  }

  function onUploaded(f: UploadedFile) {
    setUploadedFiles((prev) => [...prev.filter((x) => x.type !== f.type), f]);
  }

  const requiredTypes = [
    "MATERIALS_LIST",
    ...selected.map((d) => DEPTS.find((x) => x.value === d)!.fileType),
  ];
  const allUploaded = requiredTypes.every((t) => uploadedFiles.some((f) => f.type === t));

  function handle() {
    if (!selected.length) { toast.error("Выберите хотя бы один цех"); return; }
    if (!allUploaded) { toast.error("Загрузите все обязательные файлы"); return; }
    startTransition(async () => {
      await sendToProduction(orderId, leadId, selected, uploadedFiles);
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Wrench className="h-4 w-4 mr-1" />
        Отправить в производство
      </Button>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Отправка в производство</p>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Выбор цехов */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Цеха</p>
        <div className="flex flex-wrap gap-2">
          {DEPTS.map((d) => {
            const checked = selected.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggle(d.value)}
                className={[
                  "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                  checked
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400",
                ].join(" ")}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Обязательные файлы */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Документы</p>
        <div className="space-y-2">
          <InlineUpload
            label="Перечень материалов"
            fileType="MATERIALS_LIST"
            orderId={orderId}
            onUploaded={onUploaded}
          />
          {selected.map((dept) => {
            const d = DEPTS.find((x) => x.value === dept)!;
            return (
              <InlineUpload
                key={dept}
                label={`Наряд — ${d.label}`}
                fileType={d.fileType}
                orderId={orderId}
                onUploaded={onUploaded}
              />
            );
          })}
        </div>
      </div>

      <Button onClick={handle} disabled={isPending || !allUploaded} className="w-full sm:w-auto">
        <Wrench className="h-3.5 w-3.5 mr-1" />
        {isPending ? "Отправка..." : "Отправить в производство"}
      </Button>
      {!allUploaded && (
        <p className="text-xs text-red-500">Загрузите все обязательные файлы перед отправкой</p>
      )}
    </div>
  );
}
