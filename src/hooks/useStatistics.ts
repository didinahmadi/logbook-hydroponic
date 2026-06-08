"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Statistics {
  totalActive: number;
  totalHarvested: number;
  totalWeightKg: number;
}

export function useStatistics() {
  const [stats, setStats] = useState<Statistics>({
    totalActive: 0,
    totalHarvested: 0,
    totalWeightKg: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const [activeBatches, harvestedBatches, harvests] = await Promise.all([
        supabase
          .from("batches")
          .select("id", { count: "exact" })
          .eq("status", "active"),
        supabase
          .from("batches")
          .select("id", { count: "exact" })
          .eq("status", "harvested"),
        supabase.from("harvests").select("weight_kg"),
      ]);

      const totalWeight = (harvests.data ?? []).reduce(
        (sum, h) => sum + Number(h.weight_kg),
        0
      );

      setStats({
        totalActive: activeBatches.count ?? 0,
        totalHarvested: harvestedBatches.count ?? 0,
        totalWeightKg: totalWeight,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  return { stats, loading };
}
