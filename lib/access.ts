import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./session";

const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/dashboard",
  MANAGER: "/dashboard",
  ECONOMIST: "/dashboard",
  MEASURER: "/measurements",
  INSTALLER: "/installation",
  PRODUCTION: "/production",
  PRODUCTION_GLASS: "/production",
  PRODUCTION_PVC: "/production",
  PRODUCTION_ALUMINUM: "/production",
};

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireSession();
  if (!allowedRoles.includes(session.role)) {
    redirect(HOME_BY_ROLE[session.role] ?? "/dashboard");
  }
  return session;
}
