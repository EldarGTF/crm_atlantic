"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

type User = { id: string; name: string };
type Props = {
  action: (state: unknown, formData: FormData) => Promise<unknown>;
  users: User[];
};

export function NewTaskForm({ action, users }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {(state as { message?: string })?.message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {(state as { message: string }).message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Название *</Label>
        <Input name="title" placeholder="Позвонить клиенту, уточнить замер..." required />
      </div>

      <div className="space-y-1.5">
        <Label>Описание</Label>
        <Textarea name="description" placeholder="Подробности..." rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label>Ответственный *</Label>
        <Select name="assigneeId" required items={Object.fromEntries(users.map((u) => [u.id, u.name]))}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите сотрудника" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Срок</Label>
        <Input name="dueAt" type="date" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение..." : "Создать задачу"}
        </Button>
        <Link href="/tasks">
          <Button variant="outline" type="button">Отмена</Button>
        </Link>
      </div>
    </form>
  );
}
