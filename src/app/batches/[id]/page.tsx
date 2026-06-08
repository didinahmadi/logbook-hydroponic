"use client";

export const dynamic = "force-dynamic";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AddLogDialog } from "@/components/logs/AddLogDialog";
import { LogPhotoGallery } from "@/components/logs/LogPhotoGallery";
import { HarvestDialog } from "@/components/batches/HarvestDialog";
import { useBatch } from "@/hooks/useBatches";
import { usePlantStages } from "@/hooks/usePlants";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { calculateBatchStats } from "@/utils/batch";

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
  const { batch, loading, error } = useBatch(batchId);
  const { stages } = usePlantStages(batch?.plant_id ?? null);
  const { logs, refetch: refetchLogs } = useDailyLogs(batchId);

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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{batch.name}</h1>
                <Badge
                  className={batch.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                  variant={batch.status === "active" ? "default" : "secondary"}
                >
                  {batch.status === "active" ? "Aktif" : "Panen"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">{batch.plant.name}</p>
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
              <StatItem
                label="Target PPM"
                value={stats.ppmMin !== null ? `${stats.ppmMin}–${stats.ppmMax}` : "–"}
              />
              <StatItem label="Target pH" value={`${stats.phMin}–${stats.phMax}`} />
              <StatItem label="Panen dalam" value={`${stats.daysUntilHarvest} hari`} />
            </div>
          </CardContent>
        </Card>

        {/* Info */}
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
              <span className="text-gray-500">Jumlah Lubang</span>
              <p className="font-medium">{batch.hole_count}</p>
            </div>
            <div>
              <span className="text-gray-500">Hari Panen</span>
              <p className="font-medium">{batch.plant.harvest_days} hari</p>
            </div>
            <div>
              <span className="text-gray-500">Tahap Sekarang</span>
              <p className="font-medium">
                {stats.currentStage
                  ? `Hari ${stats.currentStage.day_from}–${stats.currentStage.day_to}`
                  : stats.ageDays > batch.plant.harvest_days
                  ? "Siap panen"
                  : "Belum masuk tahap"}
              </p>
            </div>
          </CardContent>
        </Card>

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
                <AddLogDialog batchId={batchId} onSuccess={refetchLogs} />
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
                        <div>
                          <p className="text-sm font-medium">
                            PPM: {log.ppm_actual} · pH: {log.ph_actual}
                          </p>
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
