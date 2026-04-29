"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">

        {/* Лого */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-4"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", boxShadow: "0 4px 16px rgb(37 99 235 / 0.35)" }}
          >
            A
          </div>
          <h1 className="text-xl font-bold text-slate-900">Atlantic CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Войдите в свой аккаунт</p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <form action={action} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="manager@atlantic.ru"
                autoComplete="email"
                className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                required
              />
              {state?.errors?.email && (
                <p className="text-xs text-red-500">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Пароль
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                required
              />
              {state?.errors?.password && (
                <p className="text-xs text-red-500">{state.errors.password[0]}</p>
              )}
            </div>

            {state?.message && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600">
                {state.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" }}
              disabled={pending}
            >
              {pending ? "Вход..." : "Войти"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2025 Atlantic. Система управления продажами.
        </p>
      </div>
    </div>
  );
}
