"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BatchCard } from "@/components/batches/BatchCard";
import { TodaysTasks } from "@/components/dashboard/TodaysTasks";
import { Button } from "@/components/ui/button";
import { useActiveBatches } from "@/hooks/useBatches";
import { usePlantStages } from "@/hooks/usePlants";

function BatchGrid() {
  const { batches, loading } = useActiveBatches();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">Belum ada batch aktif</p>
        <p className="text-sm mt-1">Mulai dengan membuat batch tanam pertama</p>
        <Link href="/batches/new" className="mt-4 inline-block">
          <Button className="bg-green-600 hover:bg-green-700 mt-3">
            <Plus className="h-4 w-4 mr-1" /> Buat Batch
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {batches.map((batch) => (
        <BatchCardWrapper key={batch.id} batch={batch} />
      ))}
    </div>
  );
}

function BatchCardWrapper({ batch }: { batch: import("@/types").BatchWithPlant }) {
  const { stages } = usePlantStages(batch.plant_id);
  return <BatchCard batch={batch} stages={stages} />;
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Pantau semua tanaman kamu</p>
          </div>
          <Link href="/batches/new">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-1" /> Batch Baru
            </Button>
          </Link>
        </div>

        <TodaysTasks />

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Batch Aktif</h2>
          <BatchGrid />
        </div>
      </div>
    </AppLayout>
  );
}
