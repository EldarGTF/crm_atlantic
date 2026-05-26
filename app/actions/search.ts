"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { normalizePhone } from "@/lib/phone";
import { formatOrderNumber } from "@/lib/order-number";
import { MANAGEMENT, ORDERS } from "@/lib/permissions";
import { hasRole } from "@/lib/permissions";

export type SearchResult = {
  clients: { id: string; name: string; phone: string; href: string }[];
  leads: { id: string; title: string; subtitle: string; href: string }[];
  orders: { id: string; title: string; subtitle: string; href: string }[];
};

export async function globalSearch(q: string): Promise<SearchResult> {
  const session = await requireSession();
  const term = q.trim();
  if (term.length < 2) {
    return { clients: [], leads: [], orders: [] };
  }

  const empty = { clients: [], leads: [], orders: [] };
  const digits = normalizePhone(term);
  const numMatch = term.replace(/\D/g, "");
  const orderNum = numMatch.length > 0 ? parseInt(numMatch, 10) : NaN;

  if (hasRole(session.role, MANAGEMENT)) {
    const [clients, leads] = await Promise.all([
      prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" as const } },
            { phone: { contains: digits.length >= 6 ? digits : term } },
            ...(term.includes("@") ? [{ email: { contains: term, mode: "insensitive" as const } }] : []),
          ],
        },
        take: 8,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.lead.findMany({
        where: {
          archived: false,
          OR: [
            { client: { name: { contains: term, mode: "insensitive" as const } } },
            { client: { phone: { contains: digits.length >= 6 ? digits : term } } },
            { description: { contains: term, mode: "insensitive" as const } },
          ],
        },
        include: { client: { select: { name: true, phone: true } } },
        take: 8,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const orders =
      hasRole(session.role, ORDERS) && !Number.isNaN(orderNum)
        ? await prisma.order.findMany({
            where: { number: orderNum },
            include: { lead: { include: { client: { select: { name: true, phone: true } } } } },
            take: 5,
          })
        : hasRole(session.role, ORDERS)
          ? await prisma.order.findMany({
              where: {
                archived: false,
                lead: {
                  client: {
                    OR: [
                      { name: { contains: term, mode: "insensitive" as const } },
                      { phone: { contains: digits.length >= 6 ? digits : term } },
                    ],
                  },
                },
              },
              include: { lead: { include: { client: { select: { name: true, phone: true } } } } },
              take: 8,
              orderBy: { createdAt: "desc" },
            })
          : [];

    return {
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        href: `/clients/${c.id}`,
      })),
      leads: leads.map((l) => ({
        id: l.id,
        title: l.client.name,
        subtitle: l.client.phone,
        href: `/leads/${l.id}`,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        title: `${formatOrderNumber(o.number)} — ${o.lead.client.name}`,
        subtitle: o.lead.client.phone,
        href: `/orders/${o.id}`,
      })),
    };
  }

  if (hasRole(session.role, ORDERS)) {
    const orders = await prisma.order.findMany({
      where: {
        archived: false,
        OR: [
          ...(!Number.isNaN(orderNum) ? [{ number: orderNum }] : []),
          {
            lead: {
              client: {
                OR: [
                  { name: { contains: term, mode: "insensitive" as const } },
                  { phone: { contains: digits.length >= 6 ? digits : term } },
                ],
              },
            },
          },
        ],
      },
      include: { lead: { include: { client: { select: { name: true, phone: true } } } } },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    return {
      ...empty,
      orders: orders.map((o) => ({
        id: o.id,
        title: `${formatOrderNumber(o.number)} — ${o.lead.client.name}`,
        subtitle: o.lead.client.phone,
        href: `/orders/${o.id}`,
      })),
    };
  }

  return empty;
}
