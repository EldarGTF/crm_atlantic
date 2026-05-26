"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { MANAGEMENT, PRODUCTION } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { recordLeadStatusForOrder, recordOrderStep } from "@/lib/activity";

const DEPT_ROLES: Record<string, string> = {
  GLASS: "PRODUCTION_GLASS",
  PVC: "PRODUCTION_PVC",
  ALUMINUM: "PRODUCTION_ALUMINUM",
};

const DEPT_NAMES: Record<string, string> = {
  GLASS: "Стекло",
  PVC: "ПВХ",
  ALUMINUM: "Алюминий",
};

export async function getProductionOrders(role?: string, dept?: string) {
  const session = await requireRole(PRODUCTION);
  const roleDept = Object.entries(DEPT_ROLES).find(([, r]) => r === (role ?? session.role))?.[0];
  const deptFilter = roleDept ?? (dept && ["GLASS", "PVC", "ALUMINUM"].includes(dept) ? dept : undefined);

  const orders = await prisma.order.findMany({
    where: {
      archived: false,
      lead: { status: { in: ["SENT_TO_PRODUCTION", "IN_PRODUCTION", "READY_FOR_INSTALLATION"] } },
      ...(deptFilter
        ? { productionDepts: { some: { dept: deptFilter as "GLASS" | "PVC" | "ALUMINUM" } } }
        : {}),
    },
    include: {
      lead: { include: { client: { select: { name: true, phone: true } } } },
      items: { select: { productType: true, width: true, height: true, quantity: true } },
      productionDepts: { orderBy: { dept: "asc" } },
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

export async function takeInWorkDept(orderId: string, dept: string) {
  const session = await requireRole(PRODUCTION);

  await prisma.orderProductionDept.update({
    where: { orderId_dept: { orderId, dept: dept as "GLASS" | "PVC" | "ALUMINUM" } },
    data: { inWorkAt: new Date() },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { leadId: true },
  });
  if (!order) return;

  const lead = await prisma.lead.findUnique({
    where: { id: order.leadId },
    select: { status: true },
  });

  const deptLabel = DEPT_NAMES[dept] ?? dept;
  const action = `Взят в производство — цех ${deptLabel}`;

  if (lead?.status === "SENT_TO_PRODUCTION") {
    await recordLeadStatusForOrder(order.leadId, orderId, session.userId, "IN_PRODUCTION", action);
    revalidatePath(`/leads/${order.leadId}`);
  } else {
    await recordOrderStep(orderId, session.userId, action);
  }

  revalidatePath("/production");
}

export async function markDeptDone(orderId: string, dept: string) {
  const session = await requireRole(PRODUCTION);

  await prisma.orderProductionDept.update({
    where: { orderId_dept: { orderId, dept: dept as "GLASS" | "PVC" | "ALUMINUM" } },
    data: { doneAt: new Date() },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { leadId: true, productionDepts: true },
  });
  if (!order) return;

  const deptLabel = DEPT_NAMES[dept] ?? dept;
  const allDone = order.productionDepts.every((d) => d.doneAt !== null);

  if (allDone) {
    await recordLeadStatusForOrder(
      order.leadId,
      orderId,
      session.userId,
      "READY_FOR_INSTALLATION",
      "Производство завершено, готов к монтажу"
    );
    revalidatePath(`/leads/${order.leadId}`);
  } else {
    await recordOrderStep(orderId, session.userId, `Завершено производство — цех ${deptLabel}`);
  }

  revalidatePath("/production");
  revalidatePath(`/orders/${orderId}`);
}

export async function setProductionDeadline(orderId: string, leadId: string, deadline: string) {
  const session = await requireRole(MANAGEMENT);

  await prisma.order.update({
    where: { id: orderId },
    data: { productionDeadline: new Date(deadline) },
  });

  await recordOrderStep(orderId, session.userId, "Срок производства обновлён");

  revalidatePath("/production");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/leads/${leadId}`);
}
