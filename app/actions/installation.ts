"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push";

export async function getInstallations() {
  const installations = await prisma.installation.findMany({
    where: { order: { archived: false } },
    include: {
      order: {
        include: { lead: { include: { client: { select: { name: true, phone: true } } } } },
      },
      installer: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
  return installations.map((i) => ({
    ...i,
    order: {
      ...i.order,
      totalAmount: i.order.totalAmount.toNumber(),
      prepaidAmount: i.order.prepaidAmount.toNumber(),
      installationCost: i.order.installationCost.toNumber(),
    },
  }));
}

export async function getInstallers() {
  return prisma.user.findMany({
    where: { active: true, role: { in: ["ADMIN", "INSTALLER", "MANAGER"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getOrdersReadyForInstallation() {
  const orders = await prisma.order.findMany({
    where: {
      archived: false,
      installation: null,
      lead: { status: { in: ["READY_FOR_INSTALLATION"] } },
    },
    include: { lead: { include: { client: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return orders.map((o) => ({
    ...o,
    totalAmount: o.totalAmount.toNumber(),
    prepaidAmount: o.prepaidAmount.toNumber(),
    installationCost: o.installationCost.toNumber(),
  }));
}

export async function scheduleInstallation(_state: unknown, formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const installerId = formData.get("installerId") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  const address = formData.get("address") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!orderId || !installerId || !scheduledAt || !address) {
    return { message: "Заполните все обязательные поля" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { leadId: true },
  });
  if (!order) return { message: "Заказ не найден" };

  await prisma.installation.create({
    data: { orderId, installerId, scheduledAt: new Date(scheduledAt), address, notes },
  });

  await prisma.lead.update({
    where: { id: order.leadId },
    data: {
      status: "INSTALLATION_SCHEDULED",
      statusHistory: { create: { status: "INSTALLATION_SCHEDULED", note: "Монтаж назначен" } },
    },
  });

  sendPushToUser(installerId, {
    title: "Новый монтаж",
    body: `Адрес: ${address}`,
    url: "/installation",
  }).catch(() => {});

  revalidatePath("/installation");
  revalidatePath(`/orders/${orderId}`);
  redirect("/installation");
}

export async function rescheduleInstallation(id: string, scheduledAt: string) {
  await prisma.installation.update({
    where: { id },
    data: { scheduledAt: new Date(scheduledAt) },
  });
  revalidatePath("/installation");
}

export async function takeInstallationInWork(installationId: string) {
  await prisma.installation.update({
    where: { id: installationId },
    data: { inWorkAt: new Date() },
  });
  revalidatePath("/installation");
}

export async function markInstallationDone(installationId: string, orderId: string, leadId: string) {
  await prisma.installation.update({
    where: { id: installationId },
    data: { doneAt: new Date() },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "INSTALLED",
      statusHistory: { create: { status: "INSTALLED", note: "Монтаж выполнен" } },
    },
  });

  revalidatePath("/installation");
  revalidatePath(`/orders/${orderId}`);
}
