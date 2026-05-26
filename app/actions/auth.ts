"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { createSession, deleteSession } from "@/lib/session";
import { LoginSchema, ActionState } from "@/lib/definitions";
import { HOME_BY_ROLE } from "@/lib/permissions";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { redirect } from "next/navigation";

async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

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

  const email = parsed.data.email.toLowerCase();
  const ip = await getClientIp();
  const rateKey = `login:${ip}:${email}`;
  const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
  if (!rate.ok) {
    const minutes = Math.ceil(rate.retryAfterSec / 60);
    return {
      message: `Слишком много попыток. Повторите через ${minutes} мин.`,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.active) {
    return { message: "Неверный email или пароль" };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) {
    return { message: "Неверный email или пароль" };
  }

  clearRateLimit(rateKey);
  await createSession({ userId: user.id, role: user.role, name: user.name });

  redirect(HOME_BY_ROLE[user.role] ?? "/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
