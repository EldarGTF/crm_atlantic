import { createStaff } from "@/app/actions/staff";
import { StaffForm } from "@/components/staff/staff-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewStaffPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/staff" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Новый сотрудник</h1>
      </div>
      <StaffForm action={createStaff} />
    </div>
  );
}
