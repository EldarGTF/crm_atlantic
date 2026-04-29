import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4F6F8]">
      <Sidebar role={session.role} />
      <main className="flex-1 min-w-0 p-4 md:p-7">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
