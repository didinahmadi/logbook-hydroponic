"use client";

export const dynamic = "force-dynamic";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddLogDialog } from "@/components/logs/AddLogDialog";
import { LogPhotoGallery } from "@/components/logs/LogPhotoGallery";
import { useBatch } from "@/hooks/useBatches";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { deleteDailyLog } from "@/services/batches";
import {
  SOIL_CONDITION_LABELS, APPLICATION_METHOD_LABELS,
} from "@/utils/labels";

export default function LogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: batchId } = use(params);
  const { batch } = useBatch(batchId);
  const { logs, loading, refetch } = useDailyLogs(batchId);
  const isHydroponic = batch?.growing_method === "hydroponic";

  async function handleDelete(logId: string) {
    try {
      await deleteDailyLog(logId);
      toast.success("Log dihapus");
      refetch();
    } catch {
      toast.error("Gagal menghapus log");
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/batches/${batchId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Log Harian</h1>
              {batch && <p className="text-sm text-gray-500">{batch.name}</p>}
            </div>
          </div>

          {batch?.status === "active" && (
            <AddLogDialog
              batchId={batchId}
              growingMethod={batch.growing_method}
              onSuccess={refetch}
            />
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Belum ada log harian untuk batch ini.</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {logs.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Measurements row */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm font-semibold text-gray-800">
                        {isHydroponic && log.ppm_actual != null && (
                          <span>PPM: {log.ppm_actual}</span>
                        )}
                        {isHydroponic && log.ph_actual != null && (
                          <span>pH: {log.ph_actual}</span>
                        )}
                        {log.plant_height_cm != null && (
                          <span>📏 {log.plant_height_cm} cm</span>
                        )}
                      </div>

                      {/* Watering */}
                      {log.watered_today && (
                        <p className="text-sm text-blue-600">
                          💧 Disiram{log.water_amount_ml ? ` · ${log.water_amount_ml} ml` : ""}
                        </p>
                      )}

                      {/* Soil condition */}
                      {!isHydroponic && log.soil_condition && (
                        <p className="text-sm text-amber-700">
                          🌱 Tanah: {SOIL_CONDITION_LABELS[log.soil_condition]}
                        </p>
                      )}

                      {/* Fertilizer */}
                      {log.fertilizer_name && (
                        <p className="text-sm text-green-700">
                          🌿 {log.fertilizer_name}
                          {log.fertilizer_amount ? ` · ${log.fertilizer_amount}` : ""}
                          {log.application_method ? ` · ${APPLICATION_METHOD_LABELS[log.application_method]}` : ""}
                        </p>
                      )}

                      {/* Problem */}
                      {log.problem_name && (
                        <div>
                          <p className="text-sm text-red-600 font-medium">⚠️ {log.problem_name}</p>
                          {log.treatment && (
                            <p className="text-xs text-gray-500 mt-0.5">Penanganan: {log.treatment}</p>
                          )}
                        </div>
                      )}

                      {log.note && (
                        <p className="text-sm text-gray-500">{log.note}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {format(new Date(log.created_at), "d MMM yyyy · HH:mm", { locale: id })}
                      </p>
                    </div>

                    {batch?.status === "active" && (
                      <AlertDialog>
                        <AlertDialogTrigger className="shrink-0 inline-flex items-center justify-center rounded-md p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus log ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Log beserta semua fotonya akan dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(log.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {log.log_photos && log.log_photos.length > 0 && (
                    <LogPhotoGallery
                      photos={log.log_photos}
                      canDelete={batch?.status === "active"}
                      onDeleted={refetch}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
