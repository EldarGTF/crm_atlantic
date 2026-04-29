"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/session";
import { LoginSchema, ActionState } from "@/lib/definitions";
import { redirect } from "next/navigation";

export async function login(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !user.active) {
    return { message: "Неверный email или пароль" };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) {
    return { message: "Неверный email или пароль" };
  }

  await createSession({ userId: user.id, role: user.role, name: user.name });

  const homeByRole: Record<string, string> = {
    ADMIN:      "/dashboard",
    MANAGER:    "/dashboard",
    MEASURER:   "/measurements",
    INSTALLER:  "/installation",
    PRODUCTION: "/production",
  };
  redirect(homeByRole[user.role] ?? "/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
