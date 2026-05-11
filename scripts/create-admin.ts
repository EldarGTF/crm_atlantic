import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const NAME = process.env.ADMIN_NAME?.trim() || "Администратор";
const EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  if (!EMAIL) {
    throw new Error("ADMIN_EMAIL is required");
  }
  if (!PASSWORD || PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD is required and must be at least 12 characters long");
  }

  const hashed = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { password: hashed, role: "ADMIN", active: true },
    create: { name: NAME, email: EMAIL, password: hashed, role: "ADMIN" },
  });
  console.log(`✓ Админ создан/обновлен: ${user.email}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
