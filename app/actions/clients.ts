"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { CLIENTS } from "@/lib/permissions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClientStatus } from "@/lib/generated/prisma/client";
import { normalizePhone, phonesMatch } from "@/lib/phone";

const ClientSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  phone: z.string().min(6, "Введите корректный номер"),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  address: z.string().optional(),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.REGULAR),
  notes: z.string().optional(),
});

export async function findClientsByPhone(phone: string) {
  await requireRole(CLIENTS);
  const digits = normalizePhone(phone);
  if (digits.length < 6) return [];
  const candidates = await prisma.client.findMany({
    where: { phone: { contains: digits.slice(-10) } },
    take: 10,
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, phone: true },
  });
  return candidates.filter((c) => phonesMatch(c.phone, phone));
}

export async function createClient(_state: unknown, formData: FormData) {
  await requireRole(CLIENTS);

  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    status: formData.get("status") || ClientStatus.REGULAR,
    notes: formData.get("notes") || undefined,
  };

  const parsed = ClientSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const force = formData.get("forceDuplicate") === "1";
  const duplicates = await findClientsByPhone(parsed.data.phone);
  if (duplicates.length > 0 && !force) {
    return {
      duplicateWarning: duplicates,
      message: "Клиент с таким телефоном уже есть. Сохранить всё равно?",
    };
  }

  const client = await prisma.client.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, _state: unknown, formData: FormData) {
  await requireRole(CLIENTS);

  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    status: formData.get("status") || ClientStatus.REGULAR,
    notes: formData.get("notes") || undefined,
  };

  const parsed = ClientSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.client.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  redirect(`/clients/${id}`);
}

export async function getClients(search?: string) {
  await requireRole(CLIENTS);
  return prisma.client.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { _count: { select: { leads: true, orders: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClient(id: string) {
  await requireRole(CLIENTS);
  return prisma.client.findUnique({
    where: { id },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        include: { manager: { select: { name: true } } },
      },
      orders: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
