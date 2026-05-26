"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";

export async function getNotifications(limit = 20) {
  const session = await requireSession();
  return prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadNotificationCount() {
  const session = await requireSession();
  return prisma.notification.count({
    where: { userId: session.userId, readAt: null },
  });
}

export async function markNotificationRead(id: string) {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { id, userId: session.userId },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}
