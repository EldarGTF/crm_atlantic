"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guards";
import { ORDERS } from "@/lib/permissions";
import { OrderFileType } from "@/lib/generated/prisma/client";
import { z } from "zod";

const FileInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  size: z.number().int().nonnegative(),
});

export async function addOrderFile(
  orderId: string,
  type: string,
  file: { name: string; url: string; size: number }
) {
  await requireRole(ORDERS);

  const parsedFile = FileInputSchema.safeParse(file);
  if (!parsedFile.success) return;

  const fileType = z.nativeEnum(OrderFileType).safeParse(type);
  if (!fileType.success) return;

  await prisma.orderFile.create({
    data: { orderId, type: fileType.data, ...parsedFile.data },
  });
  revalidatePath(`/orders/${orderId}`);
}

export async function deleteOrderFile(fileId: string, orderId: string) {
  await requireRole(ORDERS);

  await prisma.orderFile.delete({ where: { id: fileId } });
  revalidatePath(`/orders/${orderId}`);
}
