import { prisma } from "@/lib/prisma";

export async function logOrderActivity(orderId: string, userId: string, action: string) {
  await prisma.orderActivity.create({ data: { orderId, userId, action } });
}
