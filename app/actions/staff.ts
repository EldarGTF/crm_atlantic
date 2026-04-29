"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function getStaff() {
  return prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      createdAt: true,
      _count: { select: { leads: true, measurements: true, installations: true } },
    },
  });
}

export async function getStaffMember(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true },
  });
}

export async function createStaff(_state: unknown, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { message: "Нет доступа" };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !role || !password) return { message: "Заполните все обязательные поля" };
  if (password.length < 6) return { message: "Пароль минимум 6 символов" };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { message: "Пользователь с таким email уже существует" };

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, phone, role: role as "ADMIN" | "MANAGER" | "MEASURER" | "INSTALLER", password: hashed } });

  revalidatePath("/staff");
  redirect("/staff");
}

export async function updateStaff(_state: unknown, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { message: "Нет доступа" };

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !role) return { message: "Заполните все обязательные поля" };

  const duplicate = await prisma.user.findFirst({ where: { email, NOT: { id } } });
  if (duplicate) return { message: "Email уже занят другим сотрудником" };

  const data: Record<string, unknown> = { name, email, phone, role };
  if (password) {
    if (password.length < 6) return { message: "Пароль минимум 6 символов" };
    data.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({ where: { id }, data });

  revalidatePath("/staff");
  redirect("/staff");
}

export async function toggleStaffActive(id: string, active: boolean) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return;

  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/staff");
}
