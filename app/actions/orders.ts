"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendPushToRole } from "@/lib/push";
import { logOrderActivity } from "@/lib/activity";
import { summarizeOrderFinance } from "@/lib/order-finance";
import { canSendToProduction } from "@/lib/lead-status-transitions";

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

const ORDER_MUTATION_ROLES = ["ADMIN", "MANAGER", "ECONOMIST"];

export async function createOrder(_state: unknown, formData: FormData) {
  const session = await requireRole(ORDER_MUTATION_ROLES);

  const leadId = formData.get("leadId") as string;
  if (!leadId) return { message: "Заявка не указана" };

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { clientId: true },
  });
  if (!lead) return { message: "Заявка не найдена" };

  // Парсим позиции
  const itemsRaw = JSON.parse((formData.get("items") as string) || "[]");
  const extrasRaw = JSON.parse((formData.get("extras") as string) || "[]");

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

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "AGREED",
      statusHistory: { create: { status: "AGREED", note: "Заказ создан", userId: session.userId } },
    },
  });

  await logOrderActivity(order.id, session.userId, "Заказ создан");

  revalidatePath(`/leads/${leadId}`);
  redirect(`/orders/${order.id}`);
}

export async function addPayment(orderId: string, _state: unknown, formData: FormData) {
  const session = await requireRole(ORDER_MUTATION_ROLES);

  const amount = Number(formData.get("amount"));
  const type = formData.get("type") as "PREPAYMENT" | "FINAL" | "OTHER";
  const notes = (formData.get("notes") as string) || null;

  await prisma.payment.create({ data: { orderId, amount, type, notes } });

  const payments = await prisma.payment.findMany({ where: { orderId } });
  const paymentAmounts = payments.map((p) => Number(p.amount));
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { totalAmount: true } });
  const total = Number(order?.totalAmount ?? 0);

  const { paid, paymentStatus } = summarizeOrderFinance(total, paymentAmounts);
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
  const session = await requireRole(ORDER_MUTATION_ROLES);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { totalAmount: true, prepaidAmount: true },
  });
  if (!order) return;

  if (Number(order.prepaidAmount) < Number(order.totalAmount)) {
    return { warning: "Есть непогашенная задолженность" };
  }

  await prisma.act.create({ data: { orderId, signedAt: new Date(), fileUrl: actFile?.url ?? null } });

  if (actFile) {
    await prisma.orderFile.create({
      data: { orderId, type: "DOCUMENT", name: actFile.name, url: actFile.url, size: actFile.size },
    });
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "ACT_SIGNED",
      statusHistory: { create: { status: "ACT_SIGNED", note: "Акт выполненных работ подписан", userId: session.userId } },
    },
  });

  await logOrderActivity(orderId, session.userId, "Акт выполненных работ подписан");

  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/leads/${leadId}`);
}

export async function archiveOrder(orderId: string, leadId: string) {
  const session = await requireRole(ORDER_MUTATION_ROLES);

  await prisma.order.update({ where: { id: orderId }, data: { archived: true } });
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      archived: true,
      status: "CLOSED",
      statusHistory: { create: { status: "CLOSED", note: "Сделка закрыта", userId: session.userId } },
    },
  });

  await logOrderActivity(orderId, session.userId, "Сделка закрыта, заказ перемещён в архив");

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
  const session = await requireRole(ORDER_MUTATION_ROLES);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { status: true },
  });
  if (!lead) return { message: "Заявка не найдена" };
  if (!canSendToProduction(lead.status)) {
    return { message: "Заказ уже находится в производственном цикле" };
  }

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

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "SENT_TO_PRODUCTION",
      statusHistory: { create: { status: "SENT_TO_PRODUCTION", note: `Отправлен в производство — ${deptLabels}`, userId: session.userId } },
    },
  });

  await logOrderActivity(orderId, session.userId, `Отправлен в производство — ${deptLabels}`);

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
  paymentStatus?: string
) {
  const orders = await prisma.order.findMany({
    where: {
      archived,
      ...(paymentStatus ? { paymentStatus: paymentStatus as "UNPAID" | "PREPAID" | "PAID" } : {}),
      ...(q ? {
        OR: [
          { lead: { client: { name: { contains: q, mode: "insensitive" } } } },
          { lead: { client: { phone: { contains: q } } } },
        ],
      } : {}),
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
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      lead: {
        include: {
          client: true,
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
