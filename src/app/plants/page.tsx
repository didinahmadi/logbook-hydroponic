"use client";

export const dynamic = "force-dynamic";

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlants, usePlantStages } from "@/hooks/usePlants";
import type { Plant } from "@/types";

function PlantStagesTable({ plantId }: { plantId: string }) {
  const { stages, loading } = usePlantStages(plantId);
  if (loading) return <p className="text-xs text-gray-400 mt-2">Memuat tahapan...</p>;
  if (stages.length === 0) return null;

  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-xs font-semibold text-gray-500 mb-2">Tahapan Nutrisi</p>
      <div className="space-y-1.5">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-center justify-between text-xs text-gray-600">
            <span className="font-medium">Tahap {i + 1} (Hari {stage.day_from}–{stage.day_to})</span>
            <Badge variant="outline" className="text-xs">
              {stage.ppm_min}–{stage.ppm_max} PPM
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlantCard({ plant }: { plant: Plant }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{plant.name}</CardTitle>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            {plant.harvest_days} hari panen
          </Badge>
        </div>
        {plant.description && (
          <p className="text-sm text-gray-500 mt-1">{plant.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>pH: <strong>{plant.ph_min}–{plant.ph_max}</strong></span>
        </div>
        <PlantStagesTable plantId={plant.id} />
      </CardContent>
    </Card>
  );
}

export default function PlantsPage() {
  const { plants, loading } = usePlants();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tanaman</h1>
          <p className="text-sm text-gray-500 mt-1">Data tanaman dan panduan nutrisi</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
