"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendToProduction } from "@/app/actions/orders";
import { Wrench } from "lucide-react";

const PRODUCTION_STATUSES = new Set([
  "SENT_TO_PRODUCTION", "IN_PRODUCTION", "READY_FOR_INSTALLATION",
  "INSTALLATION_SCHEDULED", "INSTALLED", "ACT_SIGNED", "CLOSED", "CANCELLED",
]);

type Props = { orderId: string; leadId: string; leadStatus: string };

export function SendToProductionButton({ orderId, leadId, leadStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  if (PRODUCTION_STATUSES.has(leadStatus)) return null;

  function handle() {
    startTransition(() => sendToProduction(orderId, leadId));
  }

  return (
    <Button variant="outline" onClick={handle} disabled={isPending}>
      <Wrench className="h-4 w-4 mr-1" />
      {isPending ? "..." : "Отправить в производство"}
    </Button>
  );
}
