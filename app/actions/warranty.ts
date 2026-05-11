"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";
import { revalidatePath } from "next/cache";
import { logOrderActivity } from "@/lib/activity";

const WARRANTY_ROLES = ["ADMIN", "MANAGER", "ECONOMIST"];

export async function createWarrantyClaim(orderId: string, description: string) {
  const session = await requireRole(WARRANTY_ROLES);
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
  const session = await requireRole(WARRANTY_ROLES);

  await prisma.warrantyClaim.update({
    where: { id: claimId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
      resolution: status === "RESOLVED" ? (resolution ?? null) : null,
    },
  });

  const STATUS_LABELS: Record<string, string> = { OPEN: "Открыто", IN_PROGRESS: "В работе", RESOLVED: "Решено" };
  if (session) await logOrderActivity(orderId, session.userId, `Гарантийное обращение — статус: ${STATUS_LABELS[status] ?? status}`);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/warranty");
}

export async function deleteWarrantyClaim(claimId: string, orderId: string) {
  await requireRole(WARRANTY_ROLES);
  await prisma.warrantyClaim.delete({ where: { id: claimId } });
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/warranty");
}

export async function getAllWarrantyClaims(statusFilter?: "OPEN" | "IN_PROGRESS" | "RESOLVED") {
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
