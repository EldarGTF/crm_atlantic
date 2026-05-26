import { LEAD_STATUS_LABELS } from "@/lib/lead-constants";

export type TimelineEvent = {
  id: string;
  createdAt: Date;
  title: string;
  userName: string | null;
};

type OrderForTimeline = {
  createdAt: Date | string;
  activities: Array<{
    id: string;
    action: string;
    createdAt: Date | string;
    user: { name: string };
  }>;
  lead: {
    statusHistory: Array<{
      id: string;
      status: string;
      note: string | null;
      createdAt: Date | string;
      user: { name: string } | null;
    }>;
  };
};

/**
 * Лента заказа: журнал OrderActivity + ранняя история заявки (до создания заказа).
 * Не смешиваем statusHistory после создания заказа — те же события уже в activities.
 */
export function buildOrderTimeline(order: OrderForTimeline): TimelineEvent[] {
  const orderCreatedAt = new Date(order.createdAt).getTime();

  const earlyLeadEvents: TimelineEvent[] = order.lead.statusHistory
    .filter((h) => new Date(h.createdAt).getTime() < orderCreatedAt)
    .map((h) => ({
      id: `lead-${h.id}`,
      createdAt: new Date(h.createdAt),
      title: h.note ?? LEAD_STATUS_LABELS[h.status] ?? h.status,
      userName: h.user?.name ?? null,
    }));

  const orderEvents: TimelineEvent[] = order.activities.map((a) => ({
    id: `order-${a.id}`,
    createdAt: new Date(a.createdAt),
    title: a.action,
    userName: a.user.name,
  }));

  return [...earlyLeadEvents, ...orderEvents].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}
