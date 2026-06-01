"use client";

import { useEffect, useState, useTransition } from "react";
import { FileText, Trash2 } from "lucide-react";
import { deleteOrderFile } from "@/app/actions/orders-files";
import { toast } from "sonner";

type ContractFile = { id: string; name: string; url: string };

type Props = {
  orderId: string;
  files: ContractFile[];
  canDelete: boolean;
};

export function ContractFilesList({ orderId, files: initial, canDelete }: Props) {
  const [files, setFiles] = useState(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setFiles(initial);
  }, [initial]);

  function handleDelete(fileId: string, name: string) {
    if (!confirm(`Удалить договор «${name}»?`)) return;
    startTransition(async () => {
      const result = await deleteOrderFile(orderId, fileId);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("Договор удалён");
    });
  }

  if (files.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-2">
      <h2 className="font-semibold text-gray-900">Договоры</h2>
      <ul className="space-y-2">
        {files.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-2">
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline min-w-0"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{f.name}</span>
            </a>
            {canDelete && (
              <button
                type="button"
                disabled={pending}
                onClick={() => handleDelete(f.id, f.name)}
                className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                aria-label="Удалить договор"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
