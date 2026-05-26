"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { isManagement, TASKS } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push";

export async function getTasks(filter?: "my" | "done") {
  const session = await requireRole(TASKS);

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
  const session = await requireRole(TASKS);

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

  if (assigneeId !== session.userId) {
    sendPushToUser(assigneeId, {
      title: "Новая задача",
      body: title,
      url: "/tasks",
    }).catch(() => {});
  }

  revalidatePath("/tasks");
  redirect("/tasks");
}

async function assertTaskAccess(taskId: string, session: { userId: string; role: string }) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { assigneeId: true, creatorId: true },
  });
  if (!task) redirect("/tasks");
  if (
    !isManagement(session.role) &&
    task.assigneeId !== session.userId &&
    task.creatorId !== session.userId
  ) {
    redirect("/tasks");
  }
}

export async function updateTaskStatus(taskId: string, status: "PENDING" | "IN_PROGRESS" | "DONE") {
  const session = await requireRole(TASKS);
  await assertTaskAccess(taskId, session);

  await prisma.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const session = await requireRole(TASKS);
  await assertTaskAccess(taskId, session);

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
}

export async function getAllUsers() {
  await requireRole(TASKS);
  return prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
