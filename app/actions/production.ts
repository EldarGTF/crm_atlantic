"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProductionOrders() {
  const orders = await prisma.order.findMany({
    where: {
      archived: false,
      lead: { status: { in: ["SENT_TO_PRODUCTION", "IN_PRODUCTION", "READY_FOR_INSTALLATION"] } },
    },
    include: {
      lead: { include: { client: { select: { name: true, phone: true } } } },
      items: { select: { productType: true, width: true, height: true, quantity: true } },
    },
    orderBy: { productionDeadline: "asc" },
  });
  return orders.map((o) => ({
    ...o,
    totalAmount: o.totalAmount.toNumber(),
    prepaidAmount: o.prepaidAmount.toNumber(),
    installationCost: o.installationCost.toNumber(),
  }));
}

export async function setProductionStatus(leadId: string, status: "IN_PRODUCTION" | "READY_FOR_INSTALLATION") {
  const note =
    status === "IN_PRODUCTION"
      ? "Заказ взят в производство"
      : "Заказ готов к монтажу";

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      statusHistory: { create: { status, note } },
    },
  });

  revalidatePath("/production");
  revalidatePath(`/leads/${leadId}`);
}

export async function setProductionDeadline(orderId: string, leadId: string, deadline: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { productionDeadline: new Date(deadline) },
  });
  revalidatePath("/production");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/leads/${leadId}`);
}
