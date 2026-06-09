"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DailyLog, LogPhotoWithDate } from "@/types";

export function useDailyLogs(batchId: string) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*, log_photos(*)")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setLogs(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (batchId) fetchLogs();
  }, [batchId]);

  return { logs, loading, error, refetch: fetchLogs };
}

export function useBatchPhotos(batchId: string) {
  const [photos, setPhotos] = useState<LogPhotoWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!batchId) return;

    supabase
      .from("daily_logs")
      .select("id, created_at, log_photos(*)")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const allPhotos: LogPhotoWithDate[] = (data ?? []).flatMap((log) =>
          ((log.log_photos as import("@/types").LogPhoto[]) ?? []).map((photo) => ({
            ...photo,
            log_date: log.created_at,
          }))
        );
        setPhotos(allPhotos);
        setLoading(false);
      });
  }, [batchId]);

  return { photos, loading };
}
