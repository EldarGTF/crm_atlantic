import { cn } from "@/lib/utils";
import {
  CLIENT_TEMPERATURE_CLASSES,
  CLIENT_TEMPERATURE_LABELS,
} from "@/lib/client-constants";

type Temperature = keyof typeof CLIENT_TEMPERATURE_LABELS;

export function ClientTemperatureBadge({
  temperature,
  className,
}: {
  temperature: Temperature;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        CLIENT_TEMPERATURE_CLASSES[temperature],
        className,
      )}
    >
      {CLIENT_TEMPERATURE_LABELS[temperature]}
    </span>
  );
}
