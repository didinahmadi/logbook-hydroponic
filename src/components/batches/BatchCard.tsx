"use client";

import Link from "next/link";
import { Calendar, Droplets, Leaf, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BatchWithPlant } from "@/types";
import { calculateBatchStats } from "@/utils/batch";
import { GROWING_METHOD_LABELS, PLANT_STAGE_LABELS } from "@/utils/labels";

interface BatchCardProps {
  batch: BatchWithPlant;
  stages: import("@/types").PlantStage[];
}

export function BatchCard({ batch, stages }: BatchCardProps) {
  const stats = calculateBatchStats(batch.seed_date, batch.plant, stages);
  const isHydroponic = batch.growing_method === "hydroponic";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{batch.name}</CardTitle>
          <Badge
            variant={batch.status === "active" ? "default" : "secondary"}
            className={batch.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
          >
            {batch.status === "active" ? "Aktif" : "Panen"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Leaf className="h-3 w-3" />
            {batch.plant.name}
          </p>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-blue-600 font-medium">
            {GROWING_METHOD_LABELS[batch.growing_method]}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-purple-600 font-medium">
            {PLANT_STAGE_LABELS[batch.current_stage]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar className="h-3.5 w-3.5 text-green-600" />
            <span>Umur: <strong>{stats.ageDays}</strong> hari</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Timer className="h-3.5 w-3.5 text-orange-500" />
            <span>Panen: <strong>{stats.daysUntilHarvest}</strong> hari</span>
          </div>
        </div>

        {isHydroponic && stats.ppmMin !== null && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Droplets className="h-3.5 w-3.5 text-blue-500" />
            <span>
              PPM: <strong>{stats.ppmMin}–{stats.ppmMax}</strong>
              {" · "}
              pH: <strong>{stats.phMin}–{stats.phMax}</strong>
            </span>
          </div>
        )}

        <div className="pt-1">
          <Link href={`/batches/${batch.id}`}>
            <Button variant="outline" size="sm" className="w-full text-green-700 border-green-200 hover:bg-green-50">
              Lihat Detail
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
