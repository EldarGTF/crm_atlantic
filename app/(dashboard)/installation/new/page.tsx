import { getInstallers, getOrdersReadyForInstallation } from "@/app/actions/installation";
import { NewInstallationForm } from "@/components/installation/new-installation-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewInstallationPage() {
  const [orders, installers] = await Promise.all([
    getOrdersReadyForInstallation(),
    getInstallers(),
  ]);

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/installation" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Назначить монтаж</h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700 text-sm">
          Нет заказов, готовых к монтажу. Сначала отметьте заказ как "Готово к монтажу" на странице производства.
        </div>
      ) : (
        <NewInstallationForm orders={orders} installers={installers} />
      )}
    </div>
  );
}
