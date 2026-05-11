"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/access";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push";

const TASK_ROLES = [
  "ADMIN",
  "MANAGER",
  "ECONOMIST",
  "MEASURER",
  "INSTALLER",
  "PRODUCTION",
  "PRODUCTION_GLASS",
  "PRODUCTION_PVC",
  "PRODUCTION_ALUMINUM",
];

async function canMutateTask(taskId: string, userId: string, role: string) {
  if (["ADMIN", "MANAGER", "ECONOMIST"].includes(role)) return true;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { assigneeId: true, creatorId: true },
  });
  return task ? task.assigneeId === userId || task.creatorId === userId : false;
}

export async function getTasks(filter?: "my" | "done") {
  const session = await requireRole(TASK_ROLES);

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
  const session = await requireRole(TASK_ROLES);

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

export async function updateTaskStatus(taskId: string, status: "PENDING" | "IN_PROGRESS" | "DONE") {
  const session = await requireRole(TASK_ROLES);
  if (!(await canMutateTask(taskId, session.userId, session.role))) return;
  await prisma.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const session = await requireRole(TASK_ROLES);
  if (!(await canMutateTask(taskId, session.userId, session.role))) return;
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
}

export async function getAllUsers() {
  await requireSession();
  return prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
