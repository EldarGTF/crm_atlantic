import "server-only";
import { prisma } from "./prisma";
import { getSession } from "./session";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, phone: true, active: true },
  });

  if (!user?.active) return null;

  return user;
}
