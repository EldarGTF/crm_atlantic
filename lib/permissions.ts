import type { Role } from "@/lib/generated/prisma/client";

export const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/dashboard",
  MANAGER: "/dashboard",
  MEASURER: "/measurements",
  INSTALLER: "/installation",
  PRODUCTION: "/production",
  PRODUCTION_GLASS: "/production",
  PRODUCTION_PVC: "/production",
  PRODUCTION_ALUMINUM: "/production",
  ECONOMIST: "/dashboard",
};

/** Роли с доступом к управлению (дашборд, лиды, финансы). */
export const MANAGEMENT: readonly Role[] = ["ADMIN", "MANAGER", "ECONOMIST"];

export const STAFF_ADMIN: readonly Role[] = ["ADMIN"];

export const LEADS: readonly Role[] = MANAGEMENT;

export const CLIENTS: readonly Role[] = MANAGEMENT;

export const ORDERS: readonly Role[] = [
  "ADMIN",
  "MANAGER",
  "ECONOMIST",
  "PRODUCTION",
  "PRODUCTION_GLASS",
  "PRODUCTION_PVC",
  "PRODUCTION_ALUMINUM",
];

export const PRODUCTION: readonly Role[] = ORDERS;

export const MEASUREMENTS: readonly Role[] = ["ADMIN", "MANAGER", "ECONOMIST", "MEASURER"];

export const INSTALLATION: readonly Role[] = ["ADMIN", "MANAGER", "ECONOMIST", "INSTALLER"];

export const TASKS: readonly Role[] = [
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

export const TODAY: readonly Role[] = TASKS;

export const WARRANTY: readonly Role[] = MANAGEMENT;

export const ARCHIVE: readonly Role[] = MANAGEMENT;

export function hasRole(userRole: string, allowed: readonly Role[]): boolean {
  return (allowed as readonly string[]).includes(userRole);
}

export function isManagement(role: string): boolean {
  return hasRole(role, MANAGEMENT);
}
