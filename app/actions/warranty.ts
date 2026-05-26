"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { MANAGEMENT, WARRANTY } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { logOrderActivity } from "@/lib/activity";

export async function createWarrantyClaim(orderId: string, description: string) {
  const session = await requireRole(WARRANTY);
  if (!description.trim()) return { message: "Опишите проблему" };

  await prisma.warrantyClaim.create({
    data: { orderId, description: description.trim() },
  });
  await logOrderActivity(orderId, session.userId, `Гарантийное обращение: ${description.trim().slice(0, 80)}`);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/warranty");
}

export async function updateWarrantyStatus(
  claimId: string,
  orderId: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED",
  resolution?: string
) {
  const session = await requireRole(WARRANTY);

  await prisma.warrantyClaim.update({
    where: { id: claimId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
      resolution: status === "RESOLVED" ? (resolution ?? null) : null,
    },
  });

  const STATUS_LABELS: Record<string, string> = { OPEN: "Открыто", IN_PROGRESS: "В работе", RESOLVED: "Решено" };
  await logOrderActivity(orderId, session.userId, `Гарантийное обращение — статус: ${STATUS_LABELS[status] ?? status}`);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/warranty");
}

export async function deleteWarrantyClaim(claimId: string, orderId: string) {
  await requireRole(MANAGEMENT);

  await prisma.warrantyClaim.delete({ where: { id: claimId } });
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/warranty");
}

export async function getAllWarrantyClaims(statusFilter?: "OPEN" | "IN_PROGRESS" | "RESOLVED") {
  await requireRole(WARRANTY);
  return prisma.warrantyClaim.findMany({
    where: statusFilter ? { status: statusFilter } : { status: { not: "RESOLVED" } },
    include: {
      order: {
        select: {
          id: true,
          archived: true,
          lead: { select: { client: { select: { name: true, phone: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
