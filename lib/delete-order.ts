import { prisma } from "@/lib/prisma";
import { deleteStoredFileByUrl } from "@/lib/storage-object";

/** Удалить заказ и связанные файлы в хранилище (без проверки роли). */
export async function removeOrderFromDbAndStorage(orderId: string): Promise<{ ok: true } | { error: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      files: { select: { url: true } },
      act: { select: { fileUrl: true } },
    },
  });
  if (!order) return { error: "Заказ не найден" };

  for (const f of order.files) {
    await deleteStoredFileByUrl(f.url).catch(() => {});
  }
  if (order.act?.fileUrl) {
    await deleteStoredFileByUrl(order.act.fileUrl).catch(() => {});
  }

  await prisma.$transaction(async (tx) => {
    await tx.installation.deleteMany({ where: { orderId } });
    await tx.act.deleteMany({ where: { orderId } });
    await tx.order.delete({ where: { id: orderId } });
  });

  return { ok: true };
}
