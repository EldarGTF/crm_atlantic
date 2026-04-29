"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type UploadedFile = { id: string; name: string; url: string; size: number };

type Props = {
  folder: string;
  existingFiles?: UploadedFile[];
  onUpload: (file: { name: string; url: string; size: number }) => Promise<void>;
  onDelete?: (fileId: string) => Promise<void>;
};

function isImage(name: string) {
  return /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(name);
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({ folder, existingFiles = [], onUpload, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    setUploading(true);

    for (const file of Array.from(selected)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: файл больше 20 МБ`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { toast.error("Ошибка загрузки"); continue; }

      const data = await res.json();
      await onUpload(data);
      setFiles((prev) => [...prev, { id: Date.now().toString(), ...data }]);
      toast.success(`${file.name} загружен`);
    }
    setUploading(false);
  }

  async function handleDelete(fileId: string) {
    if (!onDelete) return;
    await onDelete(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  return (
    <div className="space-y-3">
      {/* Кнопки загрузки */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
          Загрузить файл
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="h-4 w-4 mr-1" /> Камера
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Список файлов */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((f) => (
            <div key={f.id} className="relative group rounded-lg border overflow-hidden bg-gray-50">
              {isImage(f.name) ? (
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  <div className="relative w-full h-28">
                    <Image src={f.url} alt={f.name} fill className="object-cover" unoptimized />
                  </div>
                </a>
              ) : (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center h-28 gap-1 text-gray-500 hover:text-blue-600"
                >
                  <File className="h-8 w-8" />
                  <span className="text-xs text-center px-1 truncate w-full text-center">{f.name}</span>
                </a>
              )}
              <div className="px-2 py-1 text-xs text-gray-400 flex items-center justify-between">
                <span className="truncate">{formatSize(f.size)}</span>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    className="text-gray-300 hover:text-red-500 ml-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
