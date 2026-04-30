"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createWarrantyClaim(orderId: string, description: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!description.trim()) return { message: "Опишите проблему" };

  await prisma.warrantyClaim.create({
    data: { orderId, description: description.trim() },
  });
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/warranty");
}

export async function updateWarrantyStatus(
  claimId: string,
  orderId: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED",
  resolution?: string
) {
  await prisma.warrantyClaim.update({
    where: { id: claimId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
      resolution: status === "RESOLVED" ? (resolution ?? null) : null,
    },
  });
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/warranty");
}

export async function deleteWarrantyClaim(claimId: string, orderId: string) {
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
