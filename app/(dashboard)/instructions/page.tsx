import { requireSession } from "@/lib/auth-guards";
import { RoleInstructions } from "@/components/instructions/role-instructions";

export default async function InstructionsPage() {
  const session = await requireSession();
  return <RoleInstructions role={session.role} />;
}
