"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push";

const MeasurementSchema = z.object({
  leadId: z.string().min(1),
  measurerId: z.string().min(1, "Выберите замерщика"),
  scheduledAt: z.string().min(1, "Укажите дату и время"),
  address: z.string().min(2, "Укажите адрес"),
  notes: z.string().optional(),
});

export async function createMeasurement(_state: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = MeasurementSchema.safeParse({
    leadId: formData.get("leadId"),
    measurerId: formData.get("measurerId"),
    scheduledAt: formData.get("scheduledAt"),
    address: formData.get("address"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

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
      statusHistory: { create: { status: "MEASUREMENT_SCHEDULED", note: "Назначен замер" } },
    },
  });

  sendPushToUser(parsed.data.measurerId, {
    title: "Новый замер",
    body: `Адрес: ${parsed.data.address}`,
    url: `/measurements/${measurement.id}`,
  }).catch(() => {});

  revalidatePath(`/leads/${parsed.data.leadId}`);
  redirect(`/measurements/${measurement.id}`);
}

export async function takeMeasurementInWork(id: string) {
  await prisma.measurement.update({
    where: { id },
    data: { inWorkAt: new Date() },
  });
  revalidatePath(`/measurements/${id}`);
  revalidatePath("/measurements");
}

export async function markMeasurementDone(id: string, leadId: string) {
  await prisma.measurement.update({
    where: { id },
    data: { doneAt: new Date() },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "MEASUREMENT_DONE",
      statusHistory: { create: { status: "MEASUREMENT_DONE", note: "Замер выполнен" } },
    },
  });

  revalidatePath(`/measurements/${id}`);
  revalidatePath(`/leads/${leadId}`);
}

export async function addMeasurementFile(
  measurementId: string,
  file: { name: string; url: string; size: number }
) {
  await prisma.measurementFile.create({
    data: { measurementId, ...file },
  });
  revalidatePath(`/measurements/${measurementId}`);
}

export async function deleteMeasurementFile(fileId: string, measurementId: string) {
  await prisma.measurementFile.delete({ where: { id: fileId } });
  revalidatePath(`/measurements/${measurementId}`);
}

export async function getMeasurement(id: string) {
  return prisma.measurement.findUnique({
    where: { id },
    include: {
      lead: { include: { client: true } },
      measurer: { select: { name: true } },
      files: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getMeasurers() {
  return prisma.user.findMany({
    where: { active: true, role: { in: ["ADMIN", "MANAGER", "MEASURER"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getMeasurements(done?: boolean) {
  return prisma.measurement.findMany({
    where: done !== undefined ? { doneAt: done ? { not: null } : null } : undefined,
    include: {
      lead: { include: { client: { select: { name: true, phone: true } } } },
      measurer: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}
