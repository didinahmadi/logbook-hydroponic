"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { LogPhotoGallery } from "@/components/logs/LogPhotoGallery";
import { useBatch } from "@/hooks/useBatches";
import { createClient } from "@/lib/supabase/client";
import type { TimelineEvent, DailyLog, Harvest } from "@/types";
import {
  PLANT_STAGE_LABELS, SOIL_CONDITION_LABELS, APPLICATION_METHOD_LABELS,
} from "@/utils/labels";

function useTimeline(batchId: string) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!batchId) return;
    const client = supabase;

    Promise.all([
      client
        .from("daily_logs")
        .select("*, log_photos(*)")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: false }),
      client
        .from("harvests")
        .select("*")
        .eq("batch_id", batchId)
        .order("harvested_at", { ascending: false }),
    ]).then(([logsResult, harvestsResult]) => {
      const logEvents: TimelineEvent[] = (logsResult.data ?? []).map((log) => ({
        type: "log" as const,
        date: log.created_at,
        data: log as DailyLog,
      }));

      const harvestEvents: TimelineEvent[] = (harvestsResult.data ?? []).map((h) => ({
        type: "harvest" as const,
        date: h.harvested_at,
        data: h as Harvest,
      }));

      const combined = [...logEvents, ...harvestEvents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEvents(combined);
      setLoading(false);
    });
  }, [batchId]);

  return { events, loading };
}

function LogEventCard({ log, isHydroponic }: { log: DailyLog; isHydroponic: boolean }) {
  const hasContent =
    (isHydroponic && (log.ppm_actual != null || log.ph_actual != null)) ||
    log.watered_today ||
    log.plant_height_cm != null ||
    log.soil_condition ||
    log.fertilizer_name ||
    log.problem_name ||
    log.note;

  return (
    <div className="ml-6 bg-white border border-gray-200 rounded-lg p-4 space-y-2">
      <p className="text-xs text-gray-400">
        {format(new Date(log.created_at), "d MMMM yyyy · HH:mm", { locale: id })}
      </p>

      {!hasContent && (
        <p className="text-sm text-gray-400 italic">Catatan kosong</p>
      )}

      {isHydroponic && (log.ppm_actual != null || log.ph_actual != null) && (
        <div className="flex gap-4 text-sm font-medium text-gray-800">
          {log.ppm_actual != null && <span>PPM: {log.ppm_actual}</span>}
          {log.ph_actual != null && <span>pH: {log.ph_actual}</span>}
        </div>
      )}

      {log.watered_today && (
        <p className="text-sm text-blue-600">
          💧 Disiram{log.water_amount_ml ? ` · ${log.water_amount_ml} ml` : ""}
        </p>
      )}

      {log.plant_height_cm != null && (
        <p className="text-sm text-gray-700">📏 Tinggi: {log.plant_height_cm} cm</p>
      )}

      {!isHydroponic && log.soil_condition && (
        <p className="text-sm text-amber-700">
          🌱 Kondisi tanah: {SOIL_CONDITION_LABELS[log.soil_condition]}
        </p>
      )}

      {log.fertilizer_name && (
        <p className="text-sm text-green-700">
          🌿 Pupuk: {log.fertilizer_name}
          {log.fertilizer_amount ? ` · ${log.fertilizer_amount}` : ""}
          {log.application_method ? ` · ${APPLICATION_METHOD_LABELS[log.application_method]}` : ""}
        </p>
      )}

      {log.problem_name && (
        <div>
          <p className="text-sm text-red-600 font-medium">⚠️ {log.problem_name}</p>
          {log.treatment && (
            <p className="text-xs text-gray-500 mt-0.5">Penanganan: {log.treatment}</p>
          )}
        </div>
      )}

      {log.note && <p className="text-sm text-gray-600">{log.note}</p>}

      {log.log_photos && log.log_photos.length > 0 && (
        <LogPhotoGallery photos={log.log_photos} />
      )}
    </div>
  );
}

function HarvestEventCard({ harvest }: { harvest: Harvest }) {
  return (
    <div className="ml-6 bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
      <p className="text-xs text-gray-400">
        {format(new Date(harvest.harvested_at), "d MMMM yyyy · HH:mm", { locale: id })}
      </p>
      <p className="text-sm font-semibold text-green-800">
        🌾 Panen: {harvest.weight_kg} kg
      </p>
      {harvest.note && <p className="text-sm text-green-700">{harvest.note}</p>}
    </div>
  );
}

export default function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: batchId } = use(params);
  const { batch } = useBatch(batchId);
  const { events, loading } = useTimeline(batchId);
  const isHydroponic = batch?.growing_method === "hydroponic";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/batches/${batchId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
            {batch && <p className="text-sm text-gray-500">{batch.name}</p>}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Belum ada catatan untuk batch ini.</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Planting event at the bottom (it's oldest, shown last) */}
            {events.map((event, i) => (
              <div key={i} className="relative">
                {/* Timeline dot */}
                <div className="absolute left-0 top-4 flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    event.type === "harvest"
                      ? "bg-green-500 border-green-600"
                      : "bg-white border-gray-300"
                  }`} />
                  {i < events.length - 1 && (
                    <div className="w-0.5 bg-gray-200 flex-1 mt-1" style={{ height: "calc(100% + 16px)" }} />
                  )}
                </div>

                {event.type === "log" && (
                  <LogEventCard log={event.data} isHydroponic={isHydroponic} />
                )}
                {event.type === "harvest" && (
                  <HarvestEventCard harvest={event.data} />
                )}
              </div>
            ))}

            {/* Planting marker */}
            {batch && (
              <div className="relative">
                <div className="absolute left-0 top-4">
                  <div className="w-3 h-3 rounded-full bg-green-600 border-2 border-green-700" />
                </div>
                <div className="ml-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-400">
                    {format(new Date(batch.seed_date), "d MMMM yyyy", { locale: id })}
                  </p>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mt-0.5">
                    <Leaf className="h-4 w-4 text-green-600" />
                    Mulai semai {batch.plant.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
