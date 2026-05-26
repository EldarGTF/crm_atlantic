import { prisma } from "@/lib/prisma";
import type { LeadStatus } from "@/lib/generated/prisma/client";

export async function logOrderActivity(orderId: string, userId: string, action: string) {
  await prisma.orderActivity.create({ data: { orderId, userId, action } });
}

/** Смена статуса заявки + запись в журнал заказа (один текст, без дублей в UI). */
export async function recordLeadStatusForOrder(
  leadId: string,
  orderId: string,
  userId: string,
  status: LeadStatus,
  action: string
) {
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      statusHistory: { create: { status, note: action, userId } },
    },
  });
  await logOrderActivity(orderId, userId, action);
}

/** Промежуточное событие без смены статуса — только журнал заказа. */
export async function recordOrderStep(orderId: string, userId: string, action: string) {
  await logOrderActivity(orderId, userId, action);
}
