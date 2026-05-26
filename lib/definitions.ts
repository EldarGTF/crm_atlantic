import { z } from "zod";
import type { Role } from "@/lib/generated/prisma/client";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Введите корректный email" }),
  password: z.string().min(1, { message: "Введите пароль" }),
});

export type SessionPayload = {
  userId: string;
  role: Role;
  name: string;
  expiresAt: Date;
};

export const PaymentSchema = z.object({
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  type: z.enum(["PREPAYMENT", "FINAL", "OTHER"]),
  notes: z.string().optional(),
});

export type ActionState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;
