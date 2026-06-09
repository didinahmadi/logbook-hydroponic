"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GrowingMethod } from "@/types";

export interface TodayTask {
  batchId: string;
  batchName: string;
  plantName: string;
  growingMethod: GrowingMethod;
}

export function useTodaysTasks() {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function fetchTasks() {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [batchesResult, logsResult] = await Promise.all([
      supabase
        .from("batches")
        .select("id, name, growing_method, plant:plants(name)")
        .eq("status", "active")
        .order("seed_date", { ascending: true }),
      supabase
        .from("daily_logs")
        .select("batch_id")
        .gte("created_at", todayStart.toISOString()),
    ]);

    const loggedIds = new Set((logsResult.data ?? []).map((l) => l.batch_id));

    const pending: TodayTask[] = (batchesResult.data ?? [])
      .filter((b) => !loggedIds.has(b.id))
      .map((b) => ({
        batchId: b.id,
        batchName: b.name,
        plantName: (b.plant as unknown as { name: string } | null)?.name ?? "–",
        growingMethod: b.growing_method as GrowingMethod,
      }));

    setTasks(pending);
    setLoading(false);
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  return { tasks, loading, refetch: fetchTasks };
}
