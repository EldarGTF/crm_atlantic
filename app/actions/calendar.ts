"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { hasRole } from "@/lib/permissions";
import { MEASUREMENTS, INSTALLATION } from "@/lib/permissions";
import { formatOrderNumber } from "@/lib/order-number";

export type CalendarEvent = {
  id: string;
  type: "measurement" | "installation";
  title: string;
  subtitle: string;
  start: Date;
  href: string;
  done: boolean;
};

export async function getCalendarEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
  const session = await requireSession();
  const events: CalendarEvent[] = [];

  if (hasRole(session.role, MEASUREMENTS)) {
    const measurements = await prisma.measurement.findMany({
      where: { scheduledAt: { gte: from, lte: to } },
      include: {
        lead: { include: { client: { select: { name: true, phone: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
    });
    for (const m of measurements) {
      events.push({
        id: m.id,
        type: "measurement",
        title: `Замер — ${m.lead.client.name}`,
        subtitle: m.lead.client.phone,
        start: m.scheduledAt,
        href: `/measurements/${m.id}`,
        done: !!m.doneAt,
      });
    }
  }

  if (hasRole(session.role, INSTALLATION)) {
    const installations = await prisma.installation.findMany({
      where: { scheduledAt: { gte: from, lte: to } },
      include: {
        order: {
          include: {
            lead: { include: { client: { select: { name: true, phone: true } } } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });
    for (const i of installations) {
      events.push({
        id: i.id,
        type: "installation",
        title: `Монтаж — ${i.order.lead.client.name} (${formatOrderNumber(i.order.number)})`,
        subtitle: i.address,
        start: i.scheduledAt,
        href: `/orders/${i.order.id}`,
        done: !!i.doneAt,
      });
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}
