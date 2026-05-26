import "server-only";

import { prisma } from "@/lib/prisma";
import { deleteSession, getSession } from "@/lib/session";
import type { Role } from "@/lib/generated/prisma/client";
import { redirect } from "next/navigation";
import { HOME_BY_ROLE, hasRole } from "@/lib/permissions";

export type AuthSession = {
  userId: string;
  role: Role;
  name: string;
};

/** Активная сессия; роль берётся из БД (не из устаревшего JWT). */
export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, active: true, role: true, name: true },
  });

  if (!user || !user.active) {
    await deleteSession();
    redirect("/login");
  }

  return { userId: user.id, role: user.role, name: user.name };
}

export async function requireRole(allowed: readonly Role[]): Promise<AuthSession> {
  const session = await requireSession();
  if (!hasRole(session.role, allowed)) {
    redirect(HOME_BY_ROLE[session.role] ?? "/login");
  }
  return session;
}

export function denyAccess(): never {
  redirect("/login");
}

/** Для API routes: без redirect, только null. */
export async function getAuthorizedSession(
  allowed: readonly Role[]
): Promise<AuthSession | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, active: true, role: true, name: true },
  });

  if (!user?.active || !hasRole(user.role, allowed)) return null;

  return { userId: user.id, role: user.role, name: user.name };
}
