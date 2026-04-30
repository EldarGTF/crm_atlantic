"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { startOfDay, endOfDay } from "date-fns";
import { redirect } from "next/navigation";

export async function getTodayData() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { userId, role } = session;
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "ECONOMIST";
  const isMeasurer = role === "MEASURER";
  const isInstaller = role === "INSTALLER";

  const [measurements, installations, tasks] = await Promise.all([
    (isAdmin || isMeasurer)
      ? prisma.measurement.findMany({
          where: {
            scheduledAt: { gte: todayStart, lte: todayEnd },
            ...(isMeasurer ? { measurerId: userId } : {}),
          },
          include: {
            measurer: { select: { name: true } },
            lead: { include: { client: { select: { name: true, phone: true } } } },
          },
          orderBy: { scheduledAt: "asc" },
        })
      : Promise.resolve([]),

    (isAdmin || isInstaller)
      ? prisma.installation.findMany({
          where: {
            scheduledAt: { gte: todayStart, lte: todayEnd },
            ...(isInstaller ? { installerId: userId } : {}),
          },
          include: {
            installer: { select: { name: true } },
            order: { include: { lead: { include: { client: { select: { name: true, phone: true } } } } } },
          },
          orderBy: { scheduledAt: "asc" },
        })
      : Promise.resolve([]),

    prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        OR: [
          { dueAt: { gte: todayStart, lte: todayEnd } },
          { dueAt: { lt: todayStart } },
        ],
        ...(!isAdmin ? { assigneeId: userId } : {}),
      },
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
        lead: { include: { client: { select: { name: true } } } },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return { measurements, installations, tasks, role };
}
