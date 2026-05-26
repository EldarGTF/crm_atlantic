import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const NAME = "Администратор";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@atlantic.kz";
const PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  if (!PASSWORD || PASSWORD.length < 8) {
    console.error("Укажите ADMIN_PASSWORD (минимум 8 символов) в переменных окружения.");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { password: hashed, role: "ADMIN", active: true },
    create: { name: NAME, email: EMAIL, password: hashed, role: "ADMIN" },
  });
  console.log(`✓ Админ создан: ${user.email}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
