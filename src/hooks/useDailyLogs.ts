"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DailyLog } from "@/types";

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
