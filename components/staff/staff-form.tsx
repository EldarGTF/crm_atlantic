"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

const ROLES = [
  { value: "ADMIN",              label: "Администратор" },
  { value: "MANAGER",            label: "Менеджер" },
  { value: "MEASURER",           label: "Замерщик" },
  { value: "INSTALLER",          label: "Монтажник" },
  { value: "PRODUCTION",         label: "Мастер производства" },
  { value: "PRODUCTION_GLASS",   label: "Цех стекла" },
  { value: "PRODUCTION_PVC",     label: "Цех ПВХ" },
  { value: "PRODUCTION_ALUMINUM", label: "Цех алюминия" },
  { value: "ECONOMIST",          label: "Экономист" },
];

type Props = {
  action: (state: unknown, formData: FormData) => Promise<unknown>;
  defaultValues?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  isEdit?: boolean;
};

export function StaffForm({ action, defaultValues, isEdit }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {(state as { message?: string })?.message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {(state as { message: string }).message}
        </div>
      )}

      {isEdit && <input type="hidden" name="id" value={defaultValues?.id} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Имя *</Label>
          <Input name="name" defaultValue={defaultValues?.name} placeholder="Иван Петров" required />
        </div>
        <div className="space-y-1.5">
          <Label>Телефон</Label>
          <Input name="phone" defaultValue={defaultValues?.phone ?? ""} placeholder="+7 999 123-45-67" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Email *</Label>
        <Input name="email" type="email" defaultValue={defaultValues?.email} placeholder="ivan@atlantic.ru" required />
      </div>

      <div className="space-y-1.5">
        <Label>Роль *</Label>
        <Select name="role" defaultValue={defaultValues?.role ?? "MANAGER"} required items={Object.fromEntries(ROLES.map((r) => [r.value, r.label]))}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите роль" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{isEdit ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль *"}</Label>
        <Input
          name="password"
          type="password"
          placeholder={isEdit ? "Не менять" : "Минимум 6 символов"}
          required={!isEdit}
          minLength={isEdit ? undefined : 6}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение..." : isEdit ? "Сохранить" : "Создать сотрудника"}
        </Button>
        <Link href="/staff">
          <Button variant="outline" type="button">Отмена</Button>
        </Link>
      </div>
    </form>
  );
}
