"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logOrderActivity } from "@/lib/activity";

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

export async function getProductionOrders(role?: string) {
  const deptFilter = Object.entries(DEPT_ROLES).find(([, r]) => r === role)?.[0];

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
  const session = await getSession();

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

  if (lead?.status === "SENT_TO_PRODUCTION") {
    await prisma.lead.update({
      where: { id: order.leadId },
      data: {
        status: "IN_PRODUCTION",
        statusHistory: { create: { status: "IN_PRODUCTION", note: `Взят в производство — цех ${deptLabel}`, userId: session?.userId ?? null } },
      },
    });
    revalidatePath(`/leads/${order.leadId}`);
  } else if (session) {
    await prisma.leadHistory.create({
      data: { leadId: order.leadId, status: "IN_PRODUCTION", note: `Взят в производство — цех ${deptLabel}`, userId: session.userId },
    });
    revalidatePath(`/leads/${order.leadId}`);
  }

  if (session) {
    await logOrderActivity(orderId, session.userId, `Взят в работу — цех ${deptLabel}`);
  }

  revalidatePath("/production");
}

export async function markDeptDone(orderId: string, dept: string) {
  const session = await getSession();

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
  const allDone = order.productionDepts.every((d) => d.doneAt !== null || d.dept === dept);

  if (allDone) {
    await prisma.lead.update({
      where: { id: order.leadId },
      data: {
        status: "READY_FOR_INSTALLATION",
        statusHistory: { create: { status: "READY_FOR_INSTALLATION", note: "Производство завершено, готов к монтажу", userId: session?.userId ?? null } },
      },
    });
    if (session) await logOrderActivity(orderId, session.userId, "Производство завершено, заказ готов к монтажу");
    revalidatePath(`/leads/${order.leadId}`);
  } else {
    if (session) {
      await prisma.leadHistory.create({
        data: { leadId: order.leadId, status: "IN_PRODUCTION", note: `Завершено производство — цех ${deptLabel}`, userId: session.userId },
      });
      await logOrderActivity(orderId, session.userId, `Завершено производство — цех ${deptLabel}`);
      revalidatePath(`/leads/${order.leadId}`);
    }
  }

  revalidatePath("/production");
  revalidatePath(`/orders/${orderId}`);
}

export async function setProductionDeadline(orderId: string, leadId: string, deadline: string) {
  const session = await getSession();

  await prisma.order.update({
    where: { id: orderId },
    data: { productionDeadline: new Date(deadline) },
  });

  if (session) {
    await logOrderActivity(orderId, session.userId, "Срок производства обновлён");
  }

  revalidatePath("/production");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/leads/${leadId}`);
}
