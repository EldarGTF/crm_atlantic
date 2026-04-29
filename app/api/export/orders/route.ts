import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "MANAGER", "ECONOMIST"].includes(session.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") || undefined;
  const payment = searchParams.get("payment") || undefined;
  const archived = searchParams.get("archived") === "1";

  const orders = await prisma.order.findMany({
    where: {
      archived,
      ...(payment ? { paymentStatus: payment as "UNPAID" | "PREPAID" | "PAID" } : {}),
      ...(q ? {
        OR: [
          { lead: { client: { name: { contains: q, mode: "insensitive" } } } },
          { lead: { client: { phone: { contains: q } } } },
        ],
      } : {}),
    },
    include: {
      lead: { include: { client: { select: { name: true, phone: true } } } },
      payments: { select: { amount: true, type: true, paidAt: true } },
      act: { select: { signedAt: true } },
      installation: { select: { scheduledAt: true, doneAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const PAYMENT_STATUS: Record<string, string> = {
    UNPAID: "Не оплачен",
    PREPAID: "Предоплата",
    PAID: "Оплачен",
  };

  const rows = [
    ["№", "Клиент", "Телефон", "Сумма (₸)", "Оплачено (₸)", "Долг (₸)", "Статус оплаты", "Акт подписан", "Дата создания"],
    ...orders.map((o, idx) => {
      const total = Number(o.totalAmount);
      const paid = o.payments.reduce((s, p) => s + Number(p.amount), 0);
      const debt = total - paid;
      return [
        idx + 1,
        o.lead.client.name,
        o.lead.client.phone,
        total,
        paid,
        debt,
        PAYMENT_STATUS[o.paymentStatus] ?? o.paymentStatus,
        o.act ? new Date(o.act.signedAt).toLocaleDateString("ru") : "",
        new Date(o.createdAt).toLocaleDateString("ru"),
      ];
    }),
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => {
        const s = String(cell);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(",")
    )
    .join("\n");

  const bom = "﻿";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
