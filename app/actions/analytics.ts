"use server";

import { prisma } from "@/lib/prisma";

export async function getAnalytics() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [orders, payments, leads] = await Promise.all([
    prisma.order.findMany({
      where: { archived: false },
      select: {
        id: true,
        totalAmount: true,
        prepaidAmount: true,
        paymentStatus: true,
        createdAt: true,
        act: { select: { signedAt: true } },
        lead: { select: { client: { select: { name: true, phone: true } } } },
      },
    }),
    prisma.payment.findMany({
      where: { paidAt: { gte: twelveMonthsAgo } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    }),
    prisma.lead.findMany({
      select: { id: true, createdAt: true, order: { select: { id: true } } },
    }),
  ]);

  // Revenue by month (last 12 months)
  const monthlyMap = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }
  for (const p of payments) {
    const d = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(p.amount));
    }
  }
  const revenueByMonth = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  // Debt list
  const debtOrders = orders
    .filter((o) => Number(o.totalAmount) > Number(o.prepaidAmount))
    .map((o) => ({
      id: o.id,
      clientName: o.lead.client.name,
      clientPhone: o.lead.client.phone,
      total: Number(o.totalAmount),
      paid: Number(o.prepaidAmount),
      debt: Number(o.totalAmount) - Number(o.prepaidAmount),
      paymentStatus: o.paymentStatus,
    }))
    .sort((a, b) => b.debt - a.debt);

  // Conversion stats
  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => l.order).length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  // Summary stats
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDebt = debtOrders.reduce((s, o) => s + o.debt, 0);
  const activeOrders = orders.filter((o) => !o.act).length;
  const signedOrders = orders.filter((o) => !!o.act).length;

  // Payment breakdown
  const paymentBreakdown = {
    UNPAID: orders.filter((o) => o.paymentStatus === "UNPAID").length,
    PREPAID: orders.filter((o) => o.paymentStatus === "PREPAID").length,
    PAID: orders.filter((o) => o.paymentStatus === "PAID").length,
  };

  return {
    revenueByMonth,
    debtOrders,
    totalRevenue,
    totalDebt,
    totalLeads,
    convertedLeads,
    conversionRate,
    activeOrders,
    signedOrders,
    paymentBreakdown,
  };
}
