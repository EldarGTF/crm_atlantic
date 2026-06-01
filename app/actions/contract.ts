"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { MANAGEMENT } from "@/lib/permissions";
import { buildContractPrefill } from "@/lib/contract-prefill";
import { renderContractDocx } from "@/lib/contract-docx";
import { ContractPayloadSchema } from "@/lib/contract-types";
import { formatContractFileName } from "@/lib/contract-format";
import { putObjectToS3, getS3PublicUrl } from "@/lib/storage-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderFileType } from "@/lib/generated/prisma/client";

export async function getContractPrefill(orderId: string) {
  await requireRole(MANAGEMENT);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      lead: {
        include: {
          client: true,
          measurements: { orderBy: { scheduledAt: "desc" }, take: 1, select: { address: true } },
        },
      },
      installation: { select: { address: true } },
    },
  });

  if (!order) return null;

  return {
    orderId: order.id,
    orderNumber: order.number,
    prefill: buildContractPrefill({
      number: order.number,
      lead: order.lead,
      installation: order.installation,
    }),
  };
}

export async function generateContract(
  orderId: string,
  payload: unknown,
): Promise<{ error?: string }> {
  await requireRole(MANAGEMENT);

  const parsed = ContractPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      Object.values(first).flat()[0] ??
      parsed.error.issues[0]?.message ??
      "Проверьте поля договора";
    return { error: msg };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, number: true },
  });
  if (!order) return { error: "Заказ не найден" };

  let buffer: Buffer;
  try {
    buffer = renderContractDocx(order.number, parsed.data);
  } catch (e) {
    console.error("[contract/generate]", e);
    return {
      error:
        e instanceof Error
          ? `Ошибка шаблона: ${e.message}`
          : "Не удалось сформировать документ",
    };
  }

  const fileName = formatContractFileName(order.number);
  const storagePath = `orders/${orderId}/contracts/${Date.now()}-${fileName.replace(/\s+/g, "_")}`;

  const put = await putObjectToS3(
    storagePath,
    buffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  if (put.error) return { error: put.error };

  const publicUrl = getS3PublicUrl(storagePath);

  await prisma.orderFile.create({
    data: {
      orderId,
      type: OrderFileType.CONTRACT,
      name: fileName,
      url: publicUrl,
      size: buffer.length,
    },
  });

  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}`);
}
