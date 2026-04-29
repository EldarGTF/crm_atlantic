import { createTask, getAllUsers } from "@/app/actions/tasks";
import { NewTaskForm } from "@/components/tasks/new-task-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function NewTaskPage() {
  const users = await getAllUsers();

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tasks" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Новая задача</h1>
      </div>
      <NewTaskForm action={createTask} users={users} />
    </div>
  );
}
