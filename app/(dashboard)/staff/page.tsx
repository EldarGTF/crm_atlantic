import Link from "next/link";
import { getStaff } from "@/app/actions/staff";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { ToggleActiveButton } from "@/components/staff/toggle-active-button";
import { Plus, Mail, Phone, Pencil } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
  MEASURER: "Замерщик",
  INSTALLER: "Монтажник",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
  MEASURER: "bg-amber-100 text-amber-700 border-amber-200",
  INSTALLER: "bg-green-100 text-green-700 border-green-200",
};

export default async function StaffPage() {
  const staff = await getStaff();
  const active = staff.filter((u) => u.active);
  const inactive = staff.filter((u) => !u.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Сотрудники</h1>
          <p className="text-sm text-gray-500 mt-0.5">Активных: {active.length}</p>
        </div>
        <LinkButton href="/staff/new">
          <Plus className="h-4 w-4 mr-1" /> Добавить
        </LinkButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {active.map((user) => (
          <div key={user.id} className="bg-white rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{user.name}</span>
                  <Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {user.phone}
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/staff/${user.id}/edit`} className="text-gray-400 hover:text-blue-600 shrink-0">
                <Pencil className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-xs text-gray-400">
                {user._count.leads > 0 && <span>Заявок: {user._count.leads}</span>}
                {user._count.measurements > 0 && <span>Замеров: {user._count.measurements}</span>}
                {user._count.installations > 0 && <span>Монтажей: {user._count.installations}</span>}
              </div>
              <ToggleActiveButton id={user.id} active={user.active} />
            </div>
          </div>
        ))}
      </div>

      {inactive.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Неактивные — {inactive.length}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {inactive.map((user) => (
              <div key={user.id} className="bg-gray-50 rounded-lg border border-dashed p-4 space-y-3 opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-600">{user.name}</span>
                      <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                    </div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                  </div>
                  <Link href={`/staff/${user.id}/edit`} className="text-gray-300 hover:text-blue-600 shrink-0">
                    <Pencil className="h-4 w-4" />
                  </Link>
                </div>
                <ToggleActiveButton id={user.id} active={user.active} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
