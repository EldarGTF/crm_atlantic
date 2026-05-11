"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";
import { revalidatePath } from "next/cache";

const ORDER_FILE_ROLES = ["ADMIN", "MANAGER", "ECONOMIST"];

export async function addOrderFile(
  orderId: string,
  type: string,
  file: { name: string; url: string; size: number }
) {
  await requireRole(ORDER_FILE_ROLES);
  await prisma.orderFile.create({
    data: { orderId, type: type as never, ...file },
  });
  revalidatePath(`/orders/${orderId}`);
}

export async function deleteOrderFile(fileId: string, orderId: string) {
  await requireRole(ORDER_FILE_ROLES);
  await prisma.orderFile.delete({ where: { id: fileId } });
  revalidatePath(`/orders/${orderId}`);
}
