"use client";

export const dynamic = "force-dynamic";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Clock, Images } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { AddLogDialog } from "@/components/logs/AddLogDialog";
import { LogPhotoGallery } from "@/components/logs/LogPhotoGallery";
import { HarvestDialog } from "@/components/batches/HarvestDialog";
import { useBatch } from "@/hooks/useBatches";
import { usePlantStages } from "@/hooks/usePlants";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { calculateBatchStats } from "@/utils/batch";
import { updateBatchStage } from "@/services/batches";
import type { PlantStageStatus } from "@/types";
import {
  GROWING_METHOD_LABELS, PLANT_STAGE_LABELS, PLANT_STAGES,
  SOIL_CONDITION_LABELS, APPLICATION_METHOD_LABELS,
} from "@/utils/labels";

function StatItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-green-700">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: batchId } = use(params);
  const router = useRouter();
  const { batch, loading, error, refetch: refetchBatch } = useBatch(batchId);
  const { stages } = usePlantStages(batch?.plant_id ?? null);
  const { logs, refetch: refetchLogs } = useDailyLogs(batchId);
  const [updatingStage, setUpdatingStage] = useState(false);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (error || !batch) {
    return (
      <AppLayout>
        <p className="text-red-500">Batch tidak ditemukan.</p>
      </AppLayout>
    );
  }

  const stats = calculateBatchStats(batch.seed_date, batch.plant, stages);
  const isHydroponic = batch.growing_method === "hydroponic";

  async function handleStageChange(stage: string | null) {
    if (!stage) return;
    setUpdatingStage(true);
    try {
      await updateBatchStage(batchId, stage as PlantStageStatus);
      await refetchBatch();
      toast.success("Fase diperbarui");
    } catch {
      toast.error("Gagal memperbarui fase");
    }
    setUpdatingStage(false);
  }

  function handleHarvestSuccess() {
    router.refresh();
    router.push("/batches");
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/batches">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{batch.name}</h1>
                <Badge
                  className={batch.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                  variant={batch.status === "active" ? "default" : "secondary"}
                >
                  {batch.status === "active" ? "Aktif" : "Panen"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                <span>{batch.plant.name}</span>
                <span>·</span>
                <span className="text-blue-600 font-medium">
                  {GROWING_METHOD_LABELS[batch.growing_method]}
                </span>
              </div>
            </div>
          </div>

          {batch.status === "active" && (
            <HarvestDialog batchId={batchId} onSuccess={handleHarvestSuccess} />
          )}
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatItem label="Umur" value={`${stats.ageDays} hari`} />
              {isHydroponic ? (
                <StatItem
                  label="Target PPM"
                  value={stats.ppmMin !== null ? `${stats.ppmMin}–${stats.ppmMax}` : "–"}
                />
              ) : (
                <StatItem label="Fase" value={PLANT_STAGE_LABELS[batch.current_stage]} />
              )}
              <StatItem label="Target pH" value={isHydroponic ? `${stats.phMin}–${stats.phMax}` : "–"} />
              <StatItem label="Panen dalam" value={`${stats.daysUntilHarvest} hari`} />
            </div>
          </CardContent>
        </Card>

        {/* Info + Stage update */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Info Batch
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Tanggal Semai</span>
              <p className="font-medium">
                {format(parseISO(batch.seed_date), "d MMMM yyyy", { locale: id })}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Jumlah Unit</span>
              <p className="font-medium">{batch.hole_count}</p>
            </div>
            <div>
              <span className="text-gray-500">Metode Tanam</span>
              <p className="font-medium">{GROWING_METHOD_LABELS[batch.growing_method]}</p>
            </div>
            {isHydroponic && (
              <div>
                <span className="text-gray-500">Tahap Nutrisi</span>
                <p className="font-medium">
                  {stats.currentStage
                    ? `Hari ${stats.currentStage.day_from}–${stats.currentStage.day_to}`
                    : stats.ageDays > batch.plant.harvest_days
                    ? "Siap panen"
                    : "Belum masuk tahap"}
                </p>
              </div>
            )}

            {/* Stage selector */}
            <div className="col-span-2">
              <span className="text-gray-500 block mb-1.5">Fase Tanaman</span>
              {batch.status === "active" ? (
                <Select
                  value={batch.current_stage}
                  onValueChange={handleStageChange}
                  disabled={updatingStage}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <span className="text-foreground font-medium">
                      {PLANT_STAGE_LABELS[batch.current_stage]}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {PLANT_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PLANT_STAGE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium">{PLANT_STAGE_LABELS[batch.current_stage]}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/batches/${batchId}/timeline`}>
            <Button variant="outline" className="w-full gap-2">
              <Clock className="h-4 w-4" /> Timeline
            </Button>
          </Link>
          <Link href={`/batches/${batchId}/gallery`}>
            <Button variant="outline" className="w-full gap-2">
              <Images className="h-4 w-4" /> Galeri Foto
            </Button>
          </Link>
        </div>

        {/* Log section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Log Harian</h2>
            <div className="flex items-center gap-2">
              <Link href={`/batches/${batchId}/logs`}>
                <Button variant="outline" size="sm">
                  <ClipboardList className="h-4 w-4 mr-1" /> Semua Log
                </Button>
              </Link>
              {batch.status === "active" && (
                <AddLogDialog
                  batchId={batchId}
                  growingMethod={batch.growing_method}
                  onSuccess={refetchLogs}
                />
              )}
            </div>
          </div>

          {logs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-400">
                <p>Belum ada log harian.</p>
                {batch.status === "active" && (
                  <p className="text-sm mt-1">Tambah log pertama untuk memulai pencatatan.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4 pb-2">
                <div className="space-y-3">
                  {logs.slice(0, 5).map((log, i) => (
                    <div key={log.id}>
                      {i > 0 && <Separator className="mb-3" />}
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm font-medium text-gray-800">
                            {isHydroponic && log.ppm_actual != null && (
                              <span>PPM: {log.ppm_actual}</span>
                            )}
                            {isHydroponic && log.ph_actual != null && (
                              <span>pH: {log.ph_actual}</span>
                            )}
                            {log.watered_today && (
                              <span className="text-blue-600">💧 Disiram{log.water_amount_ml ? ` ${log.water_amount_ml}ml` : ""}</span>
                            )}
                            {log.plant_height_cm != null && (
                              <span>📏 {log.plant_height_cm}cm</span>
                            )}
                            {log.fertilizer_name && (
                              <span className="text-green-700">🌿 {log.fertilizer_name}</span>
                            )}
                            {log.problem_name && (
                              <span className="text-red-600">⚠️ {log.problem_name}</span>
                            )}
                          </div>
                          {log.note && (
                            <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 shrink-0 ml-2">
                          {format(new Date(log.created_at), "d MMM HH:mm", { locale: id })}
                        </p>
                      </div>
                      {log.log_photos && log.log_photos.length > 0 && (
                        <LogPhotoGallery photos={log.log_photos} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
