"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { INSTALLATION } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push";
import { recordLeadStatusForOrder, recordOrderStep } from "@/lib/activity";
import { sendInstallationSms, sendRescheduleSms } from "@/lib/sms";
import {
  createDefaultChecklist,
  parseChecklist,
  type InstallationChecklist,
} from "@/lib/installation-checklist";

export async function getInstallations() {
  await requireRole(INSTALLATION);
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
  await requireRole(INSTALLATION);
  return prisma.user.findMany({
    where: { active: true, role: { in: ["ADMIN", "INSTALLER", "MANAGER"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getOrdersReadyForInstallation() {
  await requireRole(INSTALLATION);
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
  const session = await requireRole(INSTALLATION);
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
    select: {
      leadId: true,
      installation: { select: { id: true } },
      lead: { select: { client: { select: { name: true, phone: true } } } },
    },
  });
  if (!order) return { message: "Заказ не найден" };
  if (order.installation) return { message: "Монтаж по этому заказу уже назначен" };

  const installer = await prisma.user.findUnique({ where: { id: installerId }, select: { name: true } });

  await prisma.installation.create({
    data: {
      orderId,
      installerId,
      scheduledAt: new Date(scheduledAt),
      address,
      notes,
      checklist: createDefaultChecklist(),
    },
  });

  const scheduleNote = `Монтаж назначен — ${installer?.name ?? ""}`;
  await recordLeadStatusForOrder(
    order.leadId,
    orderId,
    session.userId,
    "INSTALLATION_SCHEDULED",
    scheduleNote
  );

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
  const session = await requireRole(INSTALLATION);

  await prisma.installation.update({
    where: { id },
    data: { scheduledAt: new Date(scheduledAt) },
  });

  const inst = await prisma.installation.findUnique({
    where: { id },
    select: { orderId: true, order: { select: { leadId: true, lead: { select: { client: { select: { name: true, phone: true } } } } } } },
  });

  if (inst) {
    await recordOrderStep(inst.orderId, session.userId, "Дата монтажа перенесена");
    revalidatePath(`/leads/${inst.order.leadId}`);
    const client = inst.order.lead.client;
    if (client.phone) {
      sendRescheduleSms(client.phone, client.name, "монтаж", new Date(scheduledAt)).catch(() => {});
    }
  }

  revalidatePath("/installation");
}

export async function takeInstallationInWork(installationId: string) {
  const session = await requireRole(INSTALLATION);

  await prisma.installation.update({
    where: { id: installationId },
    data: { inWorkAt: new Date() },
  });

  const inst = await prisma.installation.findUnique({
    where: { id: installationId },
    select: { orderId: true, installerId: true, order: { select: { leadId: true } } },
  });
  if (inst) {
    if (session.role === "INSTALLER" && inst.installerId !== session.userId) {
      redirect("/installation");
    }
    await recordOrderStep(inst.orderId, session.userId, "Монтаж взят в работу");
    revalidatePath(`/leads/${inst.order.leadId}`);
  }

  revalidatePath("/installation");
}

export async function markInstallationDone(installationId: string, orderId: string, leadId: string) {
  const session = await requireRole(INSTALLATION);

  await prisma.installation.update({
    where: { id: installationId },
    data: { doneAt: new Date() },
  });

  await recordLeadStatusForOrder(leadId, orderId, session.userId, "INSTALLED", "Монтаж выполнен");

  revalidatePath("/installation");
  revalidatePath(`/orders/${orderId}`);
}

export async function toggleInstallationChecklistItem(
  installationId: string,
  itemId: string
) {
  await requireRole(INSTALLATION);

  const inst = await prisma.installation.findUnique({
    where: { id: installationId },
    select: { checklist: true, orderId: true },
  });
  if (!inst) return;

  const checklist = parseChecklist(inst.checklist);
  const items = checklist.items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          done: !item.done,
          doneAt: !item.done ? new Date().toISOString() : undefined,
        }
      : item
  );

  await prisma.installation.update({
    where: { id: installationId },
    data: { checklist: { items } as InstallationChecklist },
  });

  revalidatePath("/installation");
  revalidatePath(`/orders/${inst.orderId}`);
}
