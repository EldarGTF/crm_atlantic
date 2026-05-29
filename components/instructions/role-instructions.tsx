import type { Role } from "@/lib/generated/prisma/client";
import { instructionKeyForRole } from "@/lib/instruction-roles";
import { AdminInstruction } from "./admin-instruction";
import { ManagerInstruction } from "./manager-instruction";
import { EconomistInstruction } from "./economist-instruction";
import { MeasurerInstruction } from "./measurer-instruction";
import { InstallerInstruction } from "./installer-instruction";
import { ProductionInstruction } from "./production-instruction";

type Props = { role: Role | string };

export function RoleInstructions({ role }: Props) {
  const key = instructionKeyForRole(role);

  switch (key) {
    case "admin":
      return <AdminInstruction />;
    case "manager":
      return <ManagerInstruction />;
    case "economist":
      return <EconomistInstruction />;
    case "measurer":
      return <MeasurerInstruction />;
    case "installer":
      return <InstallerInstruction />;
    case "production":
      return <ProductionInstruction role={role} />;
    default:
      return <ManagerInstruction />;
  }
}
