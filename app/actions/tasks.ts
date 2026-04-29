"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getTasks(filter?: "my" | "done") {
  const session = await getSession();
  if (!session) redirect("/login");

  return prisma.task.findMany({
    where: {
      ...(filter === "my" ? { assigneeId: session.userId } : {}),
      ...(filter === "done" ? { status: "DONE" } : { status: { not: "DONE" } }),
    },
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
      lead: { include: { client: { select: { name: true } } } },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function createTask(_state: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string) || null;
  const assigneeId = formData.get("assigneeId") as string;
  const dueAt = (formData.get("dueAt") as string) || null;
  const leadId = (formData.get("leadId") as string) || null;

  if (!title || !assigneeId) return { message: "Заполните обязательные поля" };

  await prisma.task.create({
    data: {
      title,
      description,
      assigneeId,
      creatorId: session.userId,
      dueAt: dueAt ? new Date(dueAt) : null,
      leadId: leadId || null,
    },
  });

  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function updateTaskStatus(taskId: string, status: "PENDING" | "IN_PROGRESS" | "DONE") {
  await prisma.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
}

export async function getAllUsers() {
  return prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
