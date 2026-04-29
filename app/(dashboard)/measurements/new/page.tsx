import Link from "next/link";
import { notFound } from "next/navigation";
import { createMeasurement, getMeasurers } from "@/app/actions/measurements";
import { prisma } from "@/lib/prisma";
import { MeasurementForm } from "@/components/measurements/measurement-form";
import { ChevronLeft } from "lucide-react";

type Props = { searchParams: Promise<{ leadId?: string }> };

export default async function NewMeasurementPage({ searchParams }: Props) {
  const { leadId } = await searchParams;
  if (!leadId) notFound();

  const [lead, measurers] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: leadId },
      include: { client: true },
    }),
    getMeasurers(),
  ]);

  if (!lead) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/leads/${leadId}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> {lead.client.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Назначить замер</h1>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <MeasurementForm
          action={createMeasurement}
          leadId={leadId}
          defaultAddress={lead.client.address ?? ""}
          measurers={measurers}
        />
      </div>
    </div>
  );
}
