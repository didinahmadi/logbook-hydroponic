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
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddLogDialog } from "@/components/logs/AddLogDialog";
import { LogPhotoGallery } from "@/components/logs/LogPhotoGallery";
import { useBatch } from "@/hooks/useBatches";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { deleteDailyLog } from "@/services/batches";

export default function LogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: batchId } = use(params);
  const { batch } = useBatch(batchId);
  const { logs, loading, refetch } = useDailyLogs(batchId);

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
            <AddLogDialog batchId={batchId} onSuccess={refetch} />
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
                    {/* Left: measurements + note */}
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">
                        PPM: {log.ppm_actual}
                        <Separator orientation="vertical" className="inline-block mx-1.5 h-3 align-middle" />
                        pH: {log.ph_actual}
                      </p>
                      {log.note && (
                        <p className="text-sm text-gray-500">{log.note}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {format(new Date(log.created_at), "d MMM yyyy · HH:mm", { locale: id })}
                      </p>
                    </div>

                    {/* Right: delete button */}
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

                  {/* Photos */}
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
