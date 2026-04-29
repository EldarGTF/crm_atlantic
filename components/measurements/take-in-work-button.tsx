"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { takeMeasurementInWork } from "@/app/actions/measurements";
import { PlayCircle } from "lucide-react";
import { toast } from "sonner";

export function TakeInWorkButton({ measurementId, role }: { measurementId: string; role: string }) {
  if (role !== "ADMIN" && role !== "MEASURER") return null;
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      onClick={() =>
        startTransition(async () => {
          await takeMeasurementInWork(measurementId);
          toast.success("Замер взят в работу");
        })
      }
      disabled={isPending}
      size="sm"
    >
      <PlayCircle className="h-4 w-4 mr-1" />
      {isPending ? "Сохранение..." : "Взять в работу"}
    </Button>
  );
}
