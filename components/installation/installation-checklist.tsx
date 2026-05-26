"use client";

import { useTransition } from "react";
import { toggleInstallationChecklistItem } from "@/app/actions/installation";
import type { InstallationChecklist } from "@/lib/installation-checklist";
import { CheckCircle2, Circle } from "lucide-react";

export function InstallationChecklist({
  installationId,
  checklist,
  disabled,
}: {
  installationId: string;
  checklist: InstallationChecklist;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700">Чек-лист монтажа</h3>
      <ul className="space-y-1.5">
        {checklist.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={disabled || pending}
              onClick={() =>
                startTransition(() =>
                  toggleInstallationChecklistItem(installationId, item.id)
                )
              }
              className="flex items-start gap-2 w-full text-left text-sm rounded-lg px-2 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
              )}
              <span className={item.done ? "text-slate-500 line-through" : "text-slate-800"}>
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
