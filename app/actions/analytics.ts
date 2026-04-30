"use server";

import { prisma } from "@/lib/prisma";

export async function getStaffReport() {
  const now = new Date();

  const [measurements, installations, productionDepts] = await Promise.all([
    prisma.measurement.findMany({
      select: {
        scheduledAt: true,
        inWorkAt: true,
        doneAt: true,
        measurerId: true,
        measurer: { select: { name: true } },
        lead: { select: { order: { select: { id: true } } } },
      },
    }),
    prisma.installation.findMany({
      select: {
        scheduledAt: true,
        inWorkAt: true,
        doneAt: true,
        installerId: true,
        installer: { select: { name: true } },
      },
    }),
    prisma.orderProductionDept.findMany({
      select: { dept: true, inWorkAt: true, doneAt: true },
    }),
  ]);

  // ── Замерщики ──────────────────────────────────────────────────────────────
  type MeasurerStat = { name: string; total: number; done: number; overdue: number; converted: number; durations: number[] };
  const measurerMap = new Map<string, MeasurerStat>();

  for (const m of measurements) {
    const existing = measurerMap.get(m.measurerId) ?? { name: m.measurer.name, total: 0, done: 0, overdue: 0, converted: 0, durations: [] };
    existing.total++;
    if (m.doneAt) {
      existing.done++;
      if (m.inWorkAt) existing.durations.push((new Date(m.doneAt).getTime() - new Date(m.inWorkAt).getTime()) / 3600000);
      if (m.lead.order) existing.converted++;
    } else if (new Date(m.scheduledAt) < now) {
      existing.overdue++;
    }
    measurerMap.set(m.measurerId, existing);
  }

  const measurers = Array.from(measurerMap.values())
    .map((v) => ({
      name: v.name,
      total: v.total,
      done: v.done,
      pending: v.total - v.done,
      overdue: v.overdue,
      converted: v.converted,
      conversionRate: v.done > 0 ? Math.round((v.converted / v.done) * 100) : 0,
      avgHours: v.durations.length > 0 ? Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length) : null,
    }))
    .sort((a, b) => b.total - a.total);

  // ── Монтажники ─────────────────────────────────────────────────────────────
  type InstallerStat = { name: string; total: number; done: number; overdue: number; durations: number[] };
  const installerMap = new Map<string, InstallerStat>();

  for (const inst of installations) {
    const existing = installerMap.get(inst.installerId) ?? { name: inst.installer.name, total: 0, done: 0, overdue: 0, durations: [] };
    existing.total++;
    if (inst.doneAt) {
      existing.done++;
      if (inst.inWorkAt) existing.durations.push((new Date(inst.doneAt).getTime() - new Date(inst.inWorkAt).getTime()) / 3600000);
    } else if (new Date(inst.scheduledAt) < now && !inst.inWorkAt) {
      existing.overdue++;
    }
    installerMap.set(inst.installerId, existing);
  }

  const installers = Array.from(installerMap.values())
    .map((v) => ({
      name: v.name,
      total: v.total,
      done: v.done,
      pending: v.total - v.done,
      overdue: v.overdue,
      avgHours: v.durations.length > 0 ? Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length) : null,
    }))
    .sort((a, b) => b.total - a.total);

  // ── Производство по цехам ──────────────────────────────────────────────────
  const DEPT_NAMES: Record<string, string> = { GLASS: "Стекло", PVC: "ПВХ", ALUMINUM: "Алюминий" };
  type DeptStat = { total: number; done: number; inWork: number; durations: number[] };
  const deptMap = new Map<string, DeptStat>();

  for (const d of productionDepts) {
    const existing = deptMap.get(d.dept) ?? { total: 0, done: 0, inWork: 0, durations: [] };
    existing.total++;
    if (d.doneAt) {
      existing.done++;
      if (d.inWorkAt) existing.durations.push((new Date(d.doneAt).getTime() - new Date(d.inWorkAt).getTime()) / 86400000);
    } else if (d.inWorkAt) {
      existing.inWork++;
    }
    deptMap.set(d.dept, existing);
  }

  const production = ["GLASS", "PVC", "ALUMINUM"]
    .filter((d) => deptMap.has(d))
    .map((dept) => {
      const v = deptMap.get(dept)!;
      return {
        dept,
        name: DEPT_NAMES[dept],
        total: v.total,
        done: v.done,
        inWork: v.inWork,
        pending: v.total - v.done - v.inWork,
        avgDays: v.durations.length > 0 ? (v.durations.reduce((a, b) => a + b, 0) / v.durations.length).toFixed(1) : null,
      };
    });

  return { measurers, installers, production };
}

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
