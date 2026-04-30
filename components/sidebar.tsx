"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Ruler, Package,
  Wrench, Archive, CheckSquare, HardHat, UserCog, LogOut, Menu, X, BarChart3, CalendarCheck,
} from "lucide-react";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { PushSubscribeButton } from "@/components/push-subscribe-button";

type Role = "ADMIN" | "MANAGER" | "MEASURER" | "INSTALLER" | "PRODUCTION" | "PRODUCTION_GLASS" | "PRODUCTION_PVC" | "PRODUCTION_ALUMINUM" | "ECONOMIST";

const ALL_ROLES = ["ADMIN", "MANAGER", "ECONOMIST", "MEASURER", "INSTALLER", "PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"];

const navGroups = [
  {
    label: "Продажи",
    items: [
      { href: "/today",        label: "Сегодня",      icon: CalendarCheck,   roles: ALL_ROLES },
      { href: "/dashboard",    label: "Дашборд",      icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "ECONOMIST"] },
      { href: "/analytics",    label: "Аналитика",    icon: BarChart3,       roles: ["ADMIN", "MANAGER", "ECONOMIST"] },
      { href: "/leads",        label: "Заявки",        icon: FileText,        roles: ["ADMIN", "MANAGER", "ECONOMIST"] },
      { href: "/clients",      label: "Клиенты",       icon: Users,           roles: ["ADMIN", "MANAGER", "ECONOMIST"] },
    ],
  },
  {
    label: "Выполнение",
    items: [
      { href: "/measurements", label: "Замеры",        icon: Ruler,           roles: ["ADMIN", "MANAGER", "ECONOMIST", "MEASURER"] },
      { href: "/orders",       label: "Заказы",        icon: Package,         roles: ["ADMIN", "MANAGER", "ECONOMIST"] },
      { href: "/production",   label: "Производство",  icon: Wrench,          roles: ["ADMIN", "MANAGER", "ECONOMIST", "PRODUCTION", "PRODUCTION_GLASS", "PRODUCTION_PVC", "PRODUCTION_ALUMINUM"] },
      { href: "/installation", label: "Монтаж",        icon: HardHat,         roles: ["ADMIN", "MANAGER", "ECONOMIST", "INSTALLER"] },
    ],
  },
  {
    label: "Управление",
    items: [
      { href: "/tasks",        label: "Задачи",        icon: CheckSquare,     roles: ALL_ROLES },
      { href: "/archive",      label: "Архив",         icon: Archive,         roles: ["ADMIN", "MANAGER", "ECONOMIST"] },
      { href: "/staff",        label: "Сотрудники",    icon: UserCog,         roles: ["ADMIN"] },
    ],
  },
];

function NavItem({
  href, label, icon: Icon, onClick,
}: {
  href: string; label: string; icon: React.ElementType; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100",
        active
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-blue-600" : "text-slate-400")} />
      {label}
    </Link>
  );
}

function SidebarContent({ role, onLinkClick }: { role: string; onLinkClick?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Логотип */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", boxShadow: "0 2px 8px rgb(37 99 235 / 0.35)" }}
          >
            A
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-none">Atlantic</div>
            <div className="text-xs text-slate-400 mt-0.5">CRM</div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100 mx-3 mb-2" />

      {/* Навигация */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavItem key={item.href} {...item} onClick={onLinkClick} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="h-px bg-slate-100 mx-3 mt-2" />

      {/* Уведомления + Выход */}
      <div className="px-2 py-3 space-y-1">
        <PushSubscribeButton />
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full group"
          >
            <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
            Выйти
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({ role }: { role: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-[210px] shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200">
        <SidebarContent role={role} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" }}
          >
            A
          </div>
          <span className="font-bold text-slate-900 text-sm">Atlantic CRM</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Menu className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[85vw] max-w-[240px] bg-white border-r border-slate-200 z-50 md:hidden shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
            <SidebarContent role={role} onLinkClick={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
