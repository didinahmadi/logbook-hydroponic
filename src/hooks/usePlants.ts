"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Plant, PlantStage } from "@/types";

export function usePlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("plants")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setPlants(data ?? []);
        setLoading(false);
      });
  }, []);

  return { plants, loading, error };
}

export function usePlantStages(plantId: string | null) {
  const [stages, setStages] = useState<PlantStage[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!plantId) return;
    setLoading(true);
    supabase
      .from("plant_stages")
      .select("*")
      .eq("plant_id", plantId)
      .order("day_from")
      .then(({ data }) => {
        setStages(data ?? []);
        setLoading(false);
      });
  }, [plantId]);

  return { stages, loading };
}
