"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@/lib/generated/prisma/client";
import { requireRole } from "@/lib/auth-guards";
import { STAFF_ADMIN } from "@/lib/permissions";

const StaffSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  email: z.string().email("Некорректный email"),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
  password: z.string().min(8, "Пароль минимум 8 символов").optional(),
});

export async function getStaff() {
  await requireRole(STAFF_ADMIN);
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
  await requireRole(STAFF_ADMIN);
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true },
  });
}

export async function createStaff(_state: unknown, formData: FormData) {
  await requireRole(STAFF_ADMIN);

  const parsed = StaffSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim().toLowerCase(),
    phone: (formData.get("phone") as string)?.trim() || undefined,
    role: formData.get("role"),
    password: formData.get("password") as string,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const first = Object.values(errors)[0]?.[0];
    return { message: first ?? "Проверьте данные формы" };
  }

  const { name, email, phone, role, password } = parsed.data;
  if (!password) return { message: "Укажите пароль" };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { message: "Пользователь с таким email уже существует" };

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, phone: phone || null, role, password: hashed },
  });

  revalidatePath("/staff");
  redirect("/staff");
}

export async function updateStaff(_state: unknown, formData: FormData) {
  await requireRole(STAFF_ADMIN);

  const id = formData.get("id") as string;
  const parsed = StaffSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim().toLowerCase(),
    phone: (formData.get("phone") as string)?.trim() || undefined,
    role: formData.get("role"),
    password: (formData.get("password") as string) || undefined,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const first = Object.values(errors)[0]?.[0];
    return { message: first ?? "Проверьте данные формы" };
  }

  const { name, email, phone, role, password } = parsed.data;

  const duplicate = await prisma.user.findFirst({ where: { email, NOT: { id } } });
  if (duplicate) return { message: "Email уже занят другим сотрудником" };

  const data: { name: string; email: string; phone: string | null; role: Role; password?: string } = {
    name,
    email,
    phone: phone || null,
    role,
  };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({ where: { id }, data });

  revalidatePath("/staff");
  redirect("/staff");
}

export async function toggleStaffActive(id: string, active: boolean) {
  await requireRole(STAFF_ADMIN);

  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/staff");
}
