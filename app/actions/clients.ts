"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { CLIENTS } from "@/lib/permissions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClientStatus, ClientTemperature } from "@/lib/generated/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  CLIENT_LIST_SORTS,
  type ClientListSort,
} from "@/lib/client-constants";
import { normalizePhone, phonesMatch } from "@/lib/phone";

function parseClientTemperature(value?: string): ClientTemperature | undefined {
  if (value === ClientTemperature.COLD || value === ClientTemperature.WARM || value === ClientTemperature.HOT) {
    return value;
  }
  return undefined;
}

function parseClientListSort(value?: string): ClientListSort {
  return CLIENT_LIST_SORTS.includes(value as ClientListSort)
    ? (value as ClientListSort)
    : "created_desc";
}

function clientListOrderBy(sort: ClientListSort): Prisma.ClientOrderByWithRelationInput[] {
  switch (sort) {
    case "created_asc":
      return [{ createdAt: "asc" }];
    case "name_asc":
      return [{ name: "asc" }];
    case "name_desc":
      return [{ name: "desc" }];
    case "temperature_desc":
      return [{ temperature: "desc" }, { createdAt: "desc" }];
    case "temperature_asc":
      return [{ temperature: "asc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

const ClientSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  phone: z.string().min(6, "Введите корректный номер"),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  address: z.string().optional(),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.PRIVATE),
  temperature: z.nativeEnum(ClientTemperature).default(ClientTemperature.COLD),
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
    status: formData.get("status") || ClientStatus.PRIVATE,
    temperature: formData.get("temperature") || ClientTemperature.COLD,
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
      temperature: parsed.data.temperature,
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
    status: formData.get("status") || ClientStatus.PRIVATE,
    temperature: formData.get("temperature") || ClientTemperature.COLD,
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
      temperature: parsed.data.temperature,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  redirect(`/clients/${id}`);
}

export async function getClients(
  search?: string,
  temperatureFilter?: string,
  sortParam?: string,
) {
  await requireRole(CLIENTS);

  const temperature = parseClientTemperature(temperatureFilter);
  const sort = parseClientListSort(sortParam);

  const searchWhere: Prisma.ClientWhereInput | undefined = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : undefined;

  const where: Prisma.ClientWhereInput | undefined =
    searchWhere && temperature
      ? { AND: [searchWhere, { temperature }] }
      : searchWhere ?? (temperature ? { temperature } : undefined);

  return prisma.client.findMany({
    where,
    include: { _count: { select: { leads: true, orders: true } } },
    orderBy: clientListOrderBy(sort),
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
