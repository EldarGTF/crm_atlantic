"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addOrderFile(
  orderId: string,
  file: { name: string; url: string; size: number }
) {
  await prisma.orderFile.create({ data: { orderId, ...file } });
  revalidatePath(`/orders/${orderId}`);
}

export async function deleteOrderFile(fileId: string, orderId: string) {
  await prisma.orderFile.delete({ where: { id: fileId } });
  revalidatePath(`/orders/${orderId}`);
}
