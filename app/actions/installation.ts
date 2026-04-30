"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push";
import { logOrderActivity } from "@/lib/activity";
import { sendInstallationSms, sendRescheduleSms } from "@/lib/sms";

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
  const session = await getSession();
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
    select: { leadId: true, lead: { select: { client: { select: { name: true, phone: true } } } } },
  });
  if (!order) return { message: "Заказ не найден" };

  const installer = await prisma.user.findUnique({ where: { id: installerId }, select: { name: true } });

  await prisma.installation.create({
    data: { orderId, installerId, scheduledAt: new Date(scheduledAt), address, notes },
  });

  await prisma.lead.update({
    where: { id: order.leadId },
    data: {
      status: "INSTALLATION_SCHEDULED",
      statusHistory: { create: { status: "INSTALLATION_SCHEDULED", note: `Монтаж назначен — ${installer?.name ?? ""}`, userId: session?.userId ?? null } },
    },
  });

  if (session) {
    await logOrderActivity(orderId, session.userId, `Монтаж назначен — ${installer?.name ?? ""}`);
  }

  if (order.lead.client.phone) {
    sendInstallationSms(
      order.lead.client.phone,
      order.lead.client.name,
      new Date(scheduledAt),
      address,
      installer?.name ?? ""
    ).catch(() => {});
  }

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
  const session = await getSession();

  await prisma.installation.update({
    where: { id },
    data: { scheduledAt: new Date(scheduledAt) },
  });

  const inst = await prisma.installation.findUnique({
    where: { id },
    select: { orderId: true, order: { select: { leadId: true, lead: { select: { client: { select: { name: true, phone: true } } } } } } },
  });

  if (inst) {
    if (session) {
      await logOrderActivity(inst.orderId, session.userId, "Дата монтажа перенесена");
      await prisma.leadHistory.create({
        data: { leadId: inst.order.leadId, status: "INSTALLATION_SCHEDULED", note: "Дата монтажа перенесена", userId: session.userId },
      });
      revalidatePath(`/leads/${inst.order.leadId}`);
    }
    const client = inst.order.lead.client;
    if (client.phone) {
      sendRescheduleSms(client.phone, client.name, "монтаж", new Date(scheduledAt)).catch(() => {});
    }
  }

  revalidatePath("/installation");
}

export async function takeInstallationInWork(installationId: string) {
  const session = await getSession();

  await prisma.installation.update({
    where: { id: installationId },
    data: { inWorkAt: new Date() },
  });

  if (session) {
    const inst = await prisma.installation.findUnique({
      where: { id: installationId },
      select: { orderId: true, order: { select: { leadId: true } } },
    });
    if (inst) {
      await logOrderActivity(inst.orderId, session.userId, "Монтаж взят в работу");
      await prisma.leadHistory.create({
        data: { leadId: inst.order.leadId, status: "INSTALLATION_SCHEDULED", note: "Монтаж взят в работу", userId: session.userId },
      });
      revalidatePath(`/leads/${inst.order.leadId}`);
    }
  }

  revalidatePath("/installation");
}

export async function markInstallationDone(installationId: string, orderId: string, leadId: string) {
  const session = await getSession();

  await prisma.installation.update({
    where: { id: installationId },
    data: { doneAt: new Date() },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "INSTALLED",
      statusHistory: { create: { status: "INSTALLED", note: "Монтаж выполнен", userId: session?.userId ?? null } },
    },
  });

  if (session) {
    await logOrderActivity(orderId, session.userId, "Монтаж выполнен");
  }

  revalidatePath("/installation");
  revalidatePath(`/orders/${orderId}`);
}
