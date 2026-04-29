import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Введите корректный email" }),
  password: z.string().min(1, { message: "Введите пароль" }),
});

export type SessionPayload = {
  userId: string;
  role: string;
  name: string;
  expiresAt: Date;
};

export type ActionState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;
