"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationsBell({
  initial,
  unreadCount,
}: {
  initial: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initial);
  const [unread, setUnread] = useState(unreadCount);
  const [pending, startTransition] = useTransition();

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      );
      setUnread((c) => Math.max(0, c - 1));
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
      setUnread(0);
    });
  }

  return (
    <div className="relative px-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
      >
        <Bell className="h-4 w-4" />
        <span>Уведомления</span>
        {unread > 0 && (
          <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-2 right-2 bottom-full mb-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-xs font-semibold text-slate-500">Уведомления</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                disabled={pending}
                className="text-xs text-blue-600 hover:underline"
              >
                Прочитать все
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 text-center">Нет уведомлений</p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`px-3 py-2 border-b border-slate-50 last:border-0 ${!n.readAt ? "bg-blue-50/50" : ""}`}
              >
                {n.href ? (
                  <Link
                    href={n.href}
                    onClick={() => {
                      if (!n.readAt) markRead(n.id);
                      setOpen(false);
                    }}
                    className="block"
                  >
                    <div className="text-sm font-medium text-slate-900">{n.title}</div>
                    {n.body && <div className="text-xs text-slate-500 mt-0.5">{n.body}</div>}
                  </Link>
                ) : (
                  <div>
                    <div className="text-sm font-medium text-slate-900">{n.title}</div>
                    {n.body && <div className="text-xs text-slate-500">{n.body}</div>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
