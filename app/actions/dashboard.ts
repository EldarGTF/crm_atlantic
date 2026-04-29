"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns";

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    newLeadsMonth,
    newLeadsLastMonth,
    activeOrders,
    clientsTotal,
    todayTasks,
    overdueTasks,
    production,
    todayInstallations,
    revenueMonth,
    revenueLastMonth,
    pipelineByStatus,
    recentLeads,
    upcomingInstallations,
  ] = await Promise.all([
    // Новые заявки за этот месяц
    prisma.lead.count({ where: { createdAt: { gte: monthStart, lte: monthEnd }, archived: false } }),

    // Новые заявки за прошлый месяц
    prisma.lead.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),

    // Активных заказов
    prisma.order.count({ where: { archived: false, act: null } }),

    // Всего клиентов
    prisma.client.count(),

    // Задач на сегодня
    prisma.task.count({
      where: { status: { not: "DONE" }, dueAt: { gte: todayStart, lte: todayEnd } },
    }),

    // Просроченных задач
    prisma.task.count({
      where: { status: { not: "DONE" }, dueAt: { lt: todayStart } },
    }),

    // Заказов в производстве
    prisma.order.count({
      where: { archived: false, lead: { status: { in: ["SENT_TO_PRODUCTION", "IN_PRODUCTION"] } } },
    }),

    // Монтажей сегодня
    prisma.installation.count({
      where: { scheduledAt: { gte: todayStart, lte: todayEnd }, doneAt: null },
    }),

    // Выручка этого месяца (сумма payments)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
    }),

    // Выручка прошлого месяца
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),

    // Воронка по статусам (активные заявки)
    prisma.lead.groupBy({
      by: ["status"],
      where: { archived: false },
      _count: { _all: true },
    }),

    // Последние 5 заявок
    prisma.lead.findMany({
      where: { archived: false },
      include: { client: { select: { name: true } }, manager: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),

    // Ближайшие монтажи (3 штуки)
    prisma.installation.findMany({
      where: { doneAt: null, scheduledAt: { gte: todayStart } },
      include: {
        installer: { select: { name: true } },
        order: { include: { lead: { include: { client: { select: { name: true } } } } } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    }),
  ]);

  const revenueNow = Number(revenueMonth._sum.amount ?? 0);
  const revenuePrev = Number(revenueLastMonth._sum.amount ?? 0);
  const revenueGrowth = revenuePrev > 0 ? Math.round(((revenueNow - revenuePrev) / revenuePrev) * 100) : null;
  const leadsGrowth =
    newLeadsLastMonth > 0
      ? Math.round(((newLeadsMonth - newLeadsLastMonth) / newLeadsLastMonth) * 100)
      : null;

  const pipeline = Object.fromEntries(pipelineByStatus.map((r) => [r.status, r._count._all]));

  return {
    newLeadsMonth,
    leadsGrowth,
    activeOrders,
    clientsTotal,
    todayTasks,
    overdueTasks,
    production,
    todayInstallations,
    revenueNow,
    revenuePrev,
    revenueGrowth,
    pipeline,
    recentLeads,
    upcomingInstallations,
  };
}
