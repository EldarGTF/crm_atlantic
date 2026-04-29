import { getInstallations } from "@/app/actions/installation";
import { InstallationCard } from "@/components/installation/installation-card";
import { LinkButton } from "@/components/ui/link-button";
import { Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function InstallationPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const [all, session] = await Promise.all([getInstallations(), getSession()]);
  const role = session?.role ?? "MANAGER";
  const canEdit = role !== "ECONOMIST";

  const pending = all.filter((i) => !i.doneAt);
  const done = all.filter((i) => i.doneAt);
  const list = filter === "done" ? done : pending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Монтаж</h1>
        {canEdit && (
          <LinkButton href="/installation/new">
            <Plus className="h-4 w-4 mr-1" /> Назначить монтаж
          </LinkButton>
        )}
      </div>

      <div className="flex gap-2">
        {[
          { label: `Предстоящие (${pending.length})`, value: undefined },
          { label: `Выполненные (${done.length})`, value: "done" },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={value ? `/installation?filter=${value}` : "/installation"}
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

      {list.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{filter === "done" ? "Выполненных монтажей нет" : "Монтажей не запланировано"}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((inst) => (
            <InstallationCard key={inst.id} installation={inst} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}
