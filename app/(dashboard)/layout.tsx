import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalGlobalSearch } from "@/components/conditional-global-search";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getNotifications, getUnreadNotificationCount } from "@/app/actions/notifications";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(15),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4F6F8]">
      <Sidebar
        role={session.role}
        notifications={notifications}
        unreadCount={unreadCount}
      />
      <main className="flex-1 min-w-0 p-4 md:p-7">
        <div className="max-w-5xl mx-auto space-y-4">
          <ConditionalGlobalSearch />
          {children}
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
