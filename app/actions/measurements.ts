"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { MEASUREMENTS } from "@/lib/permissions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push";
import { sendMeasurementSms, sendRescheduleSms } from "@/lib/sms";

const MeasurementSchema = z.object({
  leadId: z.string().min(1),
  measurerId: z.string().min(1, "Выберите замерщика"),
  scheduledAt: z.string().min(1, "Укажите дату и время"),
  address: z.string().min(2, "Укажите адрес"),
  notes: z.string().optional(),
});

export async function createMeasurement(_state: unknown, formData: FormData) {
  const session = await requireRole(MEASUREMENTS);

  const parsed = MeasurementSchema.safeParse({
    leadId: formData.get("leadId"),
    measurerId: formData.get("measurerId"),
    scheduledAt: formData.get("scheduledAt"),
    address: formData.get("address"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const [lead, measurer] = await Promise.all([
    prisma.lead.findUnique({ where: { id: parsed.data.leadId }, select: { client: { select: { name: true, phone: true } } } }),
    prisma.user.findUnique({ where: { id: parsed.data.measurerId }, select: { name: true } }),
  ]);

  const measurement = await prisma.measurement.create({
    data: {
      leadId: parsed.data.leadId,
      measurerId: parsed.data.measurerId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      address: parsed.data.address,
      notes: parsed.data.notes || null,
    },
  });

  await prisma.lead.update({
    where: { id: parsed.data.leadId },
    data: {
      status: "MEASUREMENT_SCHEDULED",
      statusHistory: { create: { status: "MEASUREMENT_SCHEDULED", note: "Назначен замер", userId: session.userId } },
    },
  });

  if (lead?.client.phone) {
    sendMeasurementSms(
      lead.client.phone,
      lead.client.name,
      new Date(parsed.data.scheduledAt),
      parsed.data.address,
      measurer?.name ?? ""
    ).catch(() => {});
  }

  sendPushToUser(parsed.data.measurerId, {
    title: "Новый замер",
    body: `Адрес: ${parsed.data.address}`,
    url: `/measurements/${measurement.id}`,
  }).catch(() => {});

  revalidatePath(`/leads/${parsed.data.leadId}`);
  redirect(`/measurements/${measurement.id}`);
}

async function assertMeasurementAccess(measurementId: string, session: { userId: string; role: string }) {
  const m = await prisma.measurement.findUnique({
    where: { id: measurementId },
    select: { measurerId: true },
  });
  if (!m) redirect("/measurements");
  if (session.role === "MEASURER" && m.measurerId !== session.userId) {
    redirect("/measurements");
  }
}

export async function takeMeasurementInWork(id: string) {
  const session = await requireRole(MEASUREMENTS);
  await assertMeasurementAccess(id, session);

  await prisma.measurement.update({
    where: { id },
    data: { inWorkAt: new Date() },
  });

  const m = await prisma.measurement.findUnique({ where: { id }, select: { leadId: true } });
  if (m) {
    await prisma.leadHistory.create({
      data: { leadId: m.leadId, status: "MEASUREMENT_SCHEDULED", note: "Замер взят в работу", userId: session.userId },
    });
    revalidatePath(`/leads/${m.leadId}`);
  }

  revalidatePath(`/measurements/${id}`);
  revalidatePath("/measurements");
}

export async function markMeasurementDone(id: string, leadId: string) {
  const session = await requireRole(MEASUREMENTS);
  await assertMeasurementAccess(id, session);

  await prisma.measurement.update({
    where: { id },
    data: { doneAt: new Date() },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "MEASUREMENT_DONE",
      statusHistory: { create: { status: "MEASUREMENT_DONE", note: "Замер выполнен", userId: session.userId } },
    },
  });

  revalidatePath(`/measurements/${id}`);
  revalidatePath(`/leads/${leadId}`);
}

export async function rescheduleMeasurement(id: string, scheduledAt: string, address?: string) {
  const session = await requireRole(MEASUREMENTS);
  await assertMeasurementAccess(id, session);

  await prisma.measurement.update({
    where: { id },
    data: { scheduledAt: new Date(scheduledAt), ...(address ? { address } : {}) },
  });

  const m = await prisma.measurement.findUnique({
    where: { id },
    select: { leadId: true, lead: { select: { client: { select: { name: true, phone: true } } } } },
  });

  if (m) {
    await prisma.leadHistory.create({
      data: { leadId: m.leadId, status: "MEASUREMENT_SCHEDULED", note: "Дата замера перенесена", userId: session.userId },
    });
    revalidatePath(`/leads/${m.leadId}`);
    if (m.lead.client.phone) {
      sendRescheduleSms(m.lead.client.phone, m.lead.client.name, "замер", new Date(scheduledAt)).catch(() => {});
    }
  }

  revalidatePath(`/measurements/${id}`);
  revalidatePath("/measurements");
}

export async function addMeasurementFile(
  measurementId: string,
  file: { name: string; url: string; size: number }
): Promise<{ id: string } | { error: string }> {
  const session = await requireRole(MEASUREMENTS);
  await assertMeasurementAccess(measurementId, session);

  const created = await prisma.measurementFile.create({
    data: { measurementId, name: file.name, url: file.url, size: file.size },
  });
  revalidatePath(`/measurements/${measurementId}`);
  return { id: created.id };
}

/** Порядок аргументов для .bind(null, measurementId). */
export async function deleteMeasurementFile(measurementId: string, fileId: string) {
  const session = await requireRole(MEASUREMENTS);
  await assertMeasurementAccess(measurementId, session);

  try {
    await prisma.measurementFile.delete({ where: { id: fileId, measurementId } });
  } catch {
    return { error: "Не удалось удалить файл" };
  }
  revalidatePath(`/measurements/${measurementId}`);
  return { ok: true as const };
}

export async function getMeasurement(id: string) {
  await requireRole(MEASUREMENTS);
  return prisma.measurement.findUnique({
    where: { id },
    include: {
      measurer: { select: { name: true } },
      lead: { include: { client: true } },
      files: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getMeasurers() {
  await requireRole(MEASUREMENTS);
  return prisma.user.findMany({
    where: { active: true, role: { in: ["ADMIN", "MEASURER", "MANAGER"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getMeasurements() {
  const session = await requireRole(MEASUREMENTS);
  return prisma.measurement.findMany({
    where: {
      lead: { archived: false },
      ...(session.role === "MEASURER" ? { measurerId: session.userId } : {}),
    },
    include: {
      measurer: { select: { name: true } },
      lead: { include: { client: { select: { name: true, phone: true } } } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}
