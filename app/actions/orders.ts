"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { MANAGEMENT, ORDERS, STAFF_ADMIN } from "@/lib/permissions";
import { removeOrderFromDbAndStorage } from "@/lib/delete-order";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendPushToRole } from "@/lib/push";
import { logOrderActivity, recordLeadStatusForOrder } from "@/lib/activity";
import { PaymentSchema } from "@/lib/definitions";
import { getPrismaUserMessage } from "@/lib/prisma-errors";
import { notifyRoles } from "@/lib/notify";
import { normalizePhone } from "@/lib/phone";

const OrderItemSchema = z.object({
  productType: z.string().min(1),
  profile: z.string().optional(),
  width: z.coerce.number().int().positive(),
  height: z.coerce.number().int().positive(),
  config: z.string().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
  notes: z.string().optional(),
});

const ExtraWorkSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  notes: z.string().optional(),
});

export async function createOrder(_state: unknown, formData: FormData) {
  const session = await requireRole(MANAGEMENT);

  const leadId = formData.get("leadId") as string;
  if (!leadId) return { message: "Заявка не указана" };

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { clientId: true, order: { select: { id: true } } },
  });
  if (!lead) return { message: "Заявка не найдена" };
  if (lead.order) return { message: "По этой заявке уже создан заказ" };

  let itemsRaw: unknown[] = [];
  let extrasRaw: unknown[] = [];
  try {
    itemsRaw = JSON.parse((formData.get("items") as string) || "[]");
    extrasRaw = JSON.parse((formData.get("extras") as string) || "[]");
  } catch {
    return { message: "Некорректные данные позиций заказа" };
  }
  if (!Array.isArray(itemsRaw) || !Array.isArray(extrasRaw)) {
    return { message: "Некорректные данные позиций заказа" };
  }

  const items = itemsRaw.map((i: unknown) => OrderItemSchema.parse(i));
  const extras = extrasRaw.map((e: unknown) => ExtraWorkSchema.parse(e));

  const installationIncluded = formData.get("installationIncluded") === "true";
  const installationCost = Number(formData.get("installationCost") || 0);
  const productionDeadline = formData.get("productionDeadline") as string | null;
  const notes = (formData.get("notes") as string) || null;

  const itemsTotal = items.reduce(
    (sum: number, i: z.infer<typeof OrderItemSchema>) => sum + i.unitPrice * i.quantity,
    0
  );
  const extrasTotal = extras.reduce(
    (sum: number, e: z.infer<typeof ExtraWorkSchema>) => sum + e.price,
    0
  );
  const totalAmount = itemsTotal + extrasTotal + (installationIncluded ? installationCost : 0);

  try {
    const order = await prisma.order.create({
      data: {
        leadId,
        clientId: lead.clientId,
        totalAmount,
        installationIncluded,
        installationCost,
        productionDeadline: productionDeadline ? new Date(productionDeadline) : null,
        notes,
        items: {
          create: items.map((i: z.infer<typeof OrderItemSchema>) => ({
            ...i,
            profile: i.profile || null,
            config: i.config || null,
            notes: i.notes || null,
            totalPrice: i.unitPrice * i.quantity,
          })),
        },
        extraWorks: {
          create: extras.map((e: z.infer<typeof ExtraWorkSchema>) => ({
            ...e,
            notes: e.notes || null,
          })),
        },
      },
    });

    await recordLeadStatusForOrder(leadId, order.id, session.userId, "AGREED", "Заказ создан");

    await notifyRoles(
      ["ADMIN", "MANAGER", "ECONOMIST"],
      "Новый заказ",
      `Создан заказ по заявке`,
      `/orders/${order.id}`
    );

    revalidatePath(`/leads/${leadId}`);
    redirect(`/orders/${order.id}`);
  } catch (e) {
    return { message: getPrismaUserMessage(e) ?? "Не удалось создать заказ" };
  }
}

export async function addPayment(orderId: string, _state: unknown, formData: FormData) {
  const session = await requireRole(MANAGEMENT);

  const parsed = PaymentSchema.safeParse({
    amount: formData.get("amount"),
    type: formData.get("type"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { message: first ?? "Проверьте данные оплаты" };
  }

  const { amount, type, notes } = parsed.data;

  await prisma.payment.create({ data: { orderId, amount, type, notes: notes ?? null } });

  const payments = await prisma.payment.findMany({ where: { orderId } });
  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { totalAmount: true } });
  const total = Number(order?.totalAmount ?? 0);

  const paymentStatus = paid >= total ? "PAID" : paid > 0 ? "PREPAID" : "UNPAID";
  await prisma.order.update({
    where: { id: orderId },
    data: { prepaidAmount: paid, paymentStatus },
  });

  const PAYMENT_TYPE_LABELS: Record<string, string> = { PREPAYMENT: "Предоплата", FINAL: "Остаток", OTHER: "Другое" };
  await logOrderActivity(orderId, session.userId, `Оплата ${amount.toLocaleString("ru")} ₸ — ${PAYMENT_TYPE_LABELS[type] ?? type}`);

  revalidatePath(`/orders/${orderId}`);
}

export async function signAct(
  orderId: string,
  leadId: string,
  actFile?: { name: string; url: string; size: number } | null
) {
  const session = await requireRole(MANAGEMENT);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { totalAmount: true, prepaidAmount: true, act: { select: { id: true } } },
  });
  if (!order) return;

  if (order.act) return { message: "Акт по этому заказу уже подписан" };

  if (Number(order.prepaidAmount) < Number(order.totalAmount)) {
    return { warning: "Есть непогашенная задолженность" };
  }

  try {
    await prisma.act.create({ data: { orderId, signedAt: new Date(), fileUrl: actFile?.url ?? null } });
  } catch (e) {
    return { message: getPrismaUserMessage(e) ?? "Не удалось подписать акт" };
  }

  if (actFile) {
    await prisma.orderFile.create({
      data: { orderId, type: "DOCUMENT", name: actFile.name, url: actFile.url, size: actFile.size },
    });
  }

  await recordLeadStatusForOrder(
    leadId,
    orderId,
    session.userId,
    "ACT_SIGNED",
    "Акт выполненных работ подписан"
  );

  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/leads/${leadId}`);
}

export async function deleteOrder(orderId: string): Promise<{ error?: string }> {
  await requireRole(STAFF_ADMIN);

  const result = await removeOrderFromDbAndStorage(orderId);
  if ("error" in result) return { error: result.error };

  revalidatePath("/orders");
  revalidatePath("/leads");
  redirect("/orders");
}

export async function archiveOrder(orderId: string, leadId: string) {
  const session = await requireRole(MANAGEMENT);

  await prisma.order.update({ where: { id: orderId }, data: { archived: true } });
  await prisma.lead.update({ where: { id: leadId }, data: { archived: true } });
  await recordLeadStatusForOrder(
    leadId,
    orderId,
    session.userId,
    "CLOSED",
    "Сделка закрыта, заказ перемещён в архив"
  );

  revalidatePath(`/orders/${orderId}`);
  redirect("/leads");
}

type OrderFileInput = { type: string; name: string; url: string; size: number };

export async function sendToProduction(
  orderId: string,
  leadId: string,
  depts: string[],
  files: OrderFileInput[] = []
) {
  if (!depts.length) return { message: "Выберите хотя бы один цех" };
  const session = await requireRole(MANAGEMENT);

  const DEPT_NAMES: Record<string, string> = { GLASS: "Стекло", PVC: "ПВХ", ALUMINUM: "Алюминий" };
  const deptLabels = depts.map((d) => DEPT_NAMES[d] ?? d).join(", ");

  await prisma.orderProductionDept.deleteMany({ where: { orderId } });
  await prisma.orderProductionDept.createMany({
    data: depts.map((dept) => ({ orderId, dept: dept as "GLASS" | "PVC" | "ALUMINUM" })),
  });

  if (files.length) {
    await prisma.orderFile.createMany({
      data: files.map((f) => ({ orderId, type: f.type as never, name: f.name, url: f.url, size: f.size })),
    });
  }

  await recordLeadStatusForOrder(
    leadId,
    orderId,
    session.userId,
    "SENT_TO_PRODUCTION",
    `Отправлен в производство — ${deptLabels}`
  );

  const deptRoleMap: Record<string, string> = {
    GLASS: "PRODUCTION_GLASS",
    PVC: "PRODUCTION_PVC",
    ALUMINUM: "PRODUCTION_ALUMINUM",
  };
  const pushRoles = ["PRODUCTION", ...depts.map((d) => deptRoleMap[d]).filter(Boolean)];
  for (const role of pushRoles) {
    sendPushToRole(role, {
      title: "Новый заказ в производство",
      body: "Заказ поступил в производство",
      url: "/production",
    }).catch(() => {});
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/production");
}

export async function getOrders(
  archived = false,
  q?: string,
  paymentStatus?: string,
  leadStatus?: string
) {
  await requireRole(ORDERS);
  const digits = q ? normalizePhone(q) : "";
  const numQ = q?.replace(/\D/g, "") ?? "";
  const orderNum = numQ.length > 0 ? parseInt(numQ, 10) : NaN;

  const orders = await prisma.order.findMany({
    where: {
      archived,
      ...(paymentStatus ? { paymentStatus: paymentStatus as "UNPAID" | "PREPAID" | "PAID" } : {}),
      ...(leadStatus ? { lead: { status: leadStatus as never } } : {}),
      ...(q
        ? {
            OR: [
              ...(!Number.isNaN(orderNum) ? [{ number: orderNum }] : []),
              { lead: { client: { name: { contains: q, mode: "insensitive" as const } } } },
              { lead: { client: { phone: { contains: digits.length >= 6 ? digits : q } } } },
            ],
          }
        : {}),
    },
    include: {
      lead: { include: { client: { select: { name: true, phone: true } } } },
      act: { select: { signedAt: true } },
      payments: { select: { amount: true } },
      installation: { select: { scheduledAt: true, doneAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((o) => ({
    ...o,
    totalAmount: o.totalAmount.toNumber(),
    prepaidAmount: o.prepaidAmount.toNumber(),
    installationCost: o.installationCost.toNumber(),
    payments: o.payments.map((p) => ({ ...p, amount: p.amount.toNumber() })),
  }));
}

export async function getOrder(id: string) {
  await requireRole(ORDERS);
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      lead: {
        include: {
          client: true,
          measurements: {
            orderBy: { scheduledAt: "desc" },
            take: 1,
            select: { address: true },
          },
          statusHistory: {
            orderBy: { createdAt: "asc" },
            include: { user: { select: { name: true } } },
          },
        },
      },
      items: { orderBy: { id: "asc" } },
      extraWorks: true,
      payments: { orderBy: { paidAt: "desc" } },
      files: { orderBy: { createdAt: "asc" } },
      act: true,
      installation: { include: { installer: { select: { name: true } } } },
      warrantyClaims: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
    },
  });
  if (!order) return null;
  return {
    ...order,
    totalAmount: order.totalAmount.toNumber(),
    prepaidAmount: order.prepaidAmount.toNumber(),
    installationCost: order.installationCost.toNumber(),
    items: order.items.map((i) => ({
      ...i,
      unitPrice: i.unitPrice.toNumber(),
      totalPrice: i.totalPrice.toNumber(),
    })),
    extraWorks: order.extraWorks.map((e) => ({ ...e, price: e.price.toNumber() })),
    payments: order.payments.map((p) => ({ ...p, amount: p.amount.toNumber() })),
  };
}
