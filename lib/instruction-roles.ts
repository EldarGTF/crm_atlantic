import type { Role } from "@/lib/generated/prisma/client";

export type InstructionKey =
  | "admin"
  | "manager"
  | "economist"
  | "measurer"
  | "installer"
  | "production";

export const INSTRUCTION_TITLES: Record<InstructionKey, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  economist: "Экономист",
  measurer: "Замерщик",
  installer: "Монтажник",
  production: "Производство",
};

export function instructionKeyForRole(role: Role | string): InstructionKey {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "MANAGER":
      return "manager";
    case "ECONOMIST":
      return "economist";
    case "MEASURER":
      return "measurer";
    case "INSTALLER":
      return "installer";
    case "PRODUCTION":
    case "PRODUCTION_GLASS":
    case "PRODUCTION_PVC":
    case "PRODUCTION_ALUMINUM":
      return "production";
    default:
      return "manager";
  }
}

export const PRODUCTION_DEPT_LABELS: Record<string, string> = {
  PRODUCTION: "Все цеха",
  PRODUCTION_GLASS: "Цех стекла",
  PRODUCTION_PVC: "Цех ПВХ",
  PRODUCTION_ALUMINUM: "Цех алюминия",
};
