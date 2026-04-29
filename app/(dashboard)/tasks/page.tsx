import { getTasks } from "@/app/actions/tasks";
import { TaskCard } from "@/components/tasks/task-card";
import { LinkButton } from "@/components/ui/link-button";
import { Plus, CheckSquare } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function TasksPage({ searchParams }: Props) {
  const { filter } = await searchParams;

  const filterArg = filter === "my" ? "my" : filter === "done" ? "done" : undefined;
  const [tasks, session] = await Promise.all([getTasks(filterArg), getSession()]);
  const canEdit = session?.role !== "ECONOMIST";

  const overdueTasks = tasks.filter((t) => {
    if (!t.dueAt || t.status === "DONE") return false;
    const due = new Date(t.dueAt);
    return due < new Date() && due.toDateString() !== new Date().toDateString();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Задачи</h1>
        {canEdit && (
          <LinkButton href="/tasks/new">
            <Plus className="h-4 w-4 mr-1" /> Новая задача
          </LinkButton>
        )}
      </div>

      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
          Просрочено задач: <span className="font-semibold">{overdueTasks.length}</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[
          { label: "Все активные", value: undefined },
          { label: "Мои", value: "my" },
          { label: "Выполненные", value: "done" },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={value ? `/tasks?filter=${value}` : "/tasks"}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === value || (!filter && !value)
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{filter === "done" ? "Выполненных задач нет" : "Задач нет"}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
