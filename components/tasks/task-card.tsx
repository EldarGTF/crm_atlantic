"use client";

import { useTransition } from "react";
import Link from "next/link";
import { updateTaskStatus, deleteTask } from "@/app/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Link2, Play, CheckCircle, RotateCcw, Trash2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ru } from "date-fns/locale";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: Date | null;
  assignee: { name: string };
  creator: { name: string };
  lead: { id: string; client: { name: string } } | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидает",
  IN_PROGRESS: "В работе",
  DONE: "Выполнена",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600 border-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  DONE: "bg-green-100 text-green-700 border-green-200",
};

export function TaskCard({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const due = task.dueAt ? new Date(task.dueAt) : null;
  const overdue = due && task.status !== "DONE" && isPast(due) && !isToday(due);
  const today = due && task.status !== "DONE" && isToday(due);

  function handle(status: "PENDING" | "IN_PROGRESS" | "DONE") {
    startTransition(() => updateTaskStatus(task.id, status));
  }

  function handleDelete() {
    if (!confirm("Удалить задачу?")) return;
    startTransition(() => deleteTask(task.id));
  }

  return (
    <div className={`bg-white rounded-lg border p-4 space-y-3 ${overdue ? "border-red-200" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${task.status === "DONE" ? "line-through text-gray-400" : "text-gray-900"}`}>
              {task.title}
            </span>
            <Badge className={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
          </div>
          {task.description && (
            <p className="text-sm text-gray-500">{task.description}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" /> {task.assignee.name}
        </span>
        {due && (
          <span className={`flex items-center gap-1 font-medium ${overdue ? "text-red-600" : today ? "text-amber-600" : ""}`}>
            <Calendar className="h-3.5 w-3.5" />
            {format(due, "d MMMM", { locale: ru })}
            {overdue && " — просрочено"}
            {today && " — сегодня"}
          </span>
        )}
        {task.lead && (
          <Link href={`/leads/${task.lead.id}`} className="flex items-center gap-1 text-blue-600 hover:underline">
            <Link2 className="h-3.5 w-3.5" /> {task.lead.client.name}
          </Link>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {task.status === "PENDING" && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => handle("IN_PROGRESS")}>
            <Play className="h-3.5 w-3.5 mr-1" /> Взять в работу
          </Button>
        )}
        {task.status === "IN_PROGRESS" && (
          <Button size="sm" disabled={isPending} onClick={() => handle("DONE")}>
            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Выполнена
          </Button>
        )}
        {task.status === "DONE" && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => handle("PENDING")}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Вернуть
          </Button>
        )}
      </div>
    </div>
  );
}
