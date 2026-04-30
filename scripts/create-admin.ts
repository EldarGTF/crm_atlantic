import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const NAME = "Администратор";
const EMAIL = "admin@atlantic.kz";
const PASSWORD = "admin123";

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { password: hashed, role: "ADMIN", active: true },
    create: { name: NAME, email: EMAIL, password: hashed, role: "ADMIN" },
  });
  console.log(`✓ Админ создан: ${user.email} / пароль: ${PASSWORD}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
