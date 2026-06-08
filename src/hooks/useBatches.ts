"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Batch, BatchWithPlant } from "@/types";

export function useBatches() {
  const [batches, setBatches] = useState<BatchWithPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function fetchBatches() {
    setLoading(true);
    const { data, error } = await supabase
      .from("batches")
      .select("*, plant:plants(*)")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setBatches((data as BatchWithPlant[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchBatches();
  }, []);

  return { batches, loading, error, refetch: fetchBatches };
}

export function useActiveBatches() {
  const [batches, setBatches] = useState<BatchWithPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("batches")
      .select("*, plant:plants(*)")
      .eq("status", "active")
      .order("seed_date", { ascending: true })
      .then(({ data }) => {
        setBatches((data as BatchWithPlant[]) ?? []);
        setLoading(false);
      });
  }, []);

  return { batches, loading };
}

export function useBatch(id: string) {
  const [batch, setBatch] = useState<BatchWithPlant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("batches")
      .select("*, plant:plants(*)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setBatch(data as BatchWithPlant);
        setLoading(false);
      });
  }, [id]);

  return { batch, loading, error };
}
