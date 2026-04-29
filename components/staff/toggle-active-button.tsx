"use client";

import { useTransition } from "react";
import { toggleStaffActive } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";

export function ToggleActiveButton({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handle() {
    if (!confirm(active ? "Деактивировать сотрудника?" : "Активировать сотрудника?")) return;
    startTransition(() => toggleStaffActive(id, !active));
  }

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={handle}
      className={active ? "text-red-600 hover:bg-red-50 hover:border-red-300" : "text-green-600 hover:bg-green-50 hover:border-green-300"}
    >
      {isPending ? "..." : active ? "Деактивировать" : "Активировать"}
    </Button>
  );
}
