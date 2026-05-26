import { Prisma } from "@/lib/generated/prisma/client";

export function getPrismaUserMessage(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "Такая запись уже существует";
      case "P2025":
        return "Запись не найдена";
      default:
        return null;
    }
  }
  return null;
}
