"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markMeasurementDone } from "@/app/actions/measurements";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function MarkDoneButton({ measurementId, leadId, role }: { measurementId: string; leadId: string; role: string }) {
  if (role !== "ADMIN" && role !== "MEASURER") return null;
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      onClick={() =>
        startTransition(async () => {
          await markMeasurementDone(measurementId, leadId);
          toast.success("Замер отмечен как выполненный");
        })
      }
      disabled={isPending}
      size="sm"
    >
      <CheckCircle className="h-4 w-4 mr-1" />
      {isPending ? "Сохранение..." : "Отметить выполненным"}
    </Button>
  );
}
