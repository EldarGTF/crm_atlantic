"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LeadSource, LeadStatus } from "@/lib/generated/prisma/client";

const LeadSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  source: z.nativeEnum(LeadSource).default(LeadSource.CALL),
  description: z.string().optional(),
});

export async function createLead(_state: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const raw = {
    clientId: formData.get("clientId"),
    source: formData.get("source") || LeadSource.CALL,
    description: formData.get("description") || undefined,
  };

  const parsed = LeadSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const lead = await prisma.lead.create({
    data: {
      clientId: parsed.data.clientId,
      managerId: session.userId,
      source: parsed.data.source,
      description: parsed.data.description || null,
      statusHistory: {
        create: { status: LeadStatus.NEW },
      },
    },
  });

  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function updateLeadStatus(leadId: string, status: LeadStatus, note?: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      statusHistory: {
        create: { status, note: note || null },
      },
    },
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function getLeads(search?: string, status?: string) {
  return prisma.lead.findMany({
    where: {
      archived: false,
      order: null, // только заявки без заказа
      ...(status ? { status: status as LeadStatus } : {}),
      ...(search
        ? {
            OR: [
              { client: { name: { contains: search, mode: "insensitive" } } },
              { client: { phone: { contains: search } } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      client: true,
      manager: { select: { name: true } },
      _count: { select: { measurements: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLead(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      client: true,
      manager: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: "desc" } },
      measurements: {
        orderBy: { scheduledAt: "asc" },
        include: {
          measurer: { select: { name: true } },
          files: true,
        },
      },
      order: {
        include: { items: true, act: true },
      },
      tasks: {
        where: { status: { not: "DONE" } },
        orderBy: { dueAt: "asc" },
      },
    },
  });
}

export async function getArchivedLeads(search?: string, status?: string) {
  return prisma.lead.findMany({
    where: {
      archived: true,
      ...(status ? { status: status as LeadStatus } : {}),
      ...(search
        ? {
            OR: [
              { client: { name: { contains: search, mode: "insensitive" } } },
              { client: { phone: { contains: search } } },
            ],
          }
        : {}),
    },
    include: {
      client: { select: { name: true, phone: true } },
      manager: { select: { name: true } },
      order: { select: { totalAmount: true, prepaidAmount: true, act: { select: { signedAt: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getClientsForSelect() {
  return prisma.client.findMany({
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });
}
