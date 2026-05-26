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
): Promise<{ id: string } | { error: string }> {
  await requireRole(ORDERS);

  const parsedFile = FileInputSchema.safeParse(file);
  if (!parsedFile.success) {
    return { error: "Некорректные данные файла" };
  }

  const fileType = z.nativeEnum(OrderFileType).safeParse(type);
  if (!fileType.success) {
    return { error: "Некорректный тип файла" };
  }

  const created = await prisma.orderFile.create({
    data: { orderId, type: fileType.data, ...parsedFile.data },
  });
  revalidatePath(`/orders/${orderId}`);
  return { id: created.id };
}

/** Порядок аргументов для .bind(null, orderId) из страницы заказа. */
export async function deleteOrderFile(orderId: string, fileId: string) {
  await requireRole(ORDERS);

  try {
    await prisma.orderFile.delete({ where: { id: fileId, orderId } });
  } catch {
    return { error: "Не удалось удалить файл" };
  }
  revalidatePath(`/orders/${orderId}`);
  return { ok: true as const };
}
