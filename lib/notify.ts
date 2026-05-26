import "server-only";

import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/generated/prisma/client";

export async function notifyUser(
  userId: string,
  title: string,
  body?: string,
  href?: string
) {
  await prisma.notification.create({
    data: { userId, title, body: body ?? null, href: href ?? null },
  });
}

export async function notifyRoles(
  roles: readonly Role[],
  title: string,
  body?: string,
  href?: string
) {
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: [...roles] } },
    select: { id: true },
  });
  if (users.length === 0) return;
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title,
      body: body ?? null,
      href: href ?? null,
    })),
  });
}
