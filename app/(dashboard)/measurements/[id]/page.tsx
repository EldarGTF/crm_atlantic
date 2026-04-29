import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeasurement, markMeasurementDone, addMeasurementFile, deleteMeasurementFile } from "@/app/actions/measurements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/file-uploader";
import { ChevronLeft, Calendar, MapPin, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MarkDoneButton } from "@/components/measurements/mark-done-button";
import { getSession } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export default async function MeasurementPage({ params }: Props) {
  const { id } = await params;
  const [m, session] = await Promise.all([getMeasurement(id), getSession()]);
  if (!m) notFound();
  const role = session?.role ?? "MANAGER";

  const addFile = addMeasurementFile.bind(null, id);
  const deleteFile = deleteMeasurementFile.bind(null, ...["" as string, id] as [string, string]);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link
          href={`/leads/${m.leadId}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> {m.lead.client.name}
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">Замер</h1>
          <Badge variant={m.doneAt ? "secondary" : "default"} className="text-sm px-3 py-1">
            {m.doneAt ? "Выполнен" : "Запланирован"}
          </Badge>
        </div>
      </div>

      {/* Детали */}
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-gray-500 text-xs">Дата и время</div>
              <div className="font-medium">
                {format(new Date(m.scheduledAt), "d MMMM yyyy, HH:mm", { locale: ru })}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-gray-500 text-xs">Замерщик</div>
              <div className="font-medium">{m.measurer.name}</div>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-gray-500 text-xs">Адрес</div>
              <div className="font-medium">{m.address}</div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(m.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline"
              >
                Открыть в картах →
              </a>
            </div>
          </div>
          {m.notes && (
            <div className="flex items-start gap-2 sm:col-span-2">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-gray-500 text-xs">Примечания</div>
                <div className="text-gray-700">{m.notes}</div>
              </div>
            </div>
          )}
        </div>

        {!m.doneAt && (
          <div className="pt-2 border-t">
            <MarkDoneButton measurementId={id} leadId={m.leadId} role={role} />
          </div>
        )}
        {m.doneAt && (
          <div className="pt-2 border-t text-sm text-gray-500">
            Выполнен: {format(new Date(m.doneAt), "d MMMM yyyy, HH:mm", { locale: ru })}
          </div>
        )}
      </div>

      {/* Фото и файлы */}
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">Фото и файлы ({m.files.length})</h2>
        <FileUploader
          folder={`measurements/${id}`}
          existingFiles={m.files}
          onUpload={addFile}
          onDelete={async (fileId) => { "use server"; await deleteMeasurementFile(fileId, id); }}
        />
      </div>
    </div>
  );
}
