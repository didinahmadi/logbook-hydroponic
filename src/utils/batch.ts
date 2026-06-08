import { differenceInDays, parseISO } from "date-fns";
import type { BatchStats, Plant, PlantStage } from "@/types";

export function calculateBatchStats(
  seedDate: string,
  plant: Plant,
  stages: PlantStage[]
): BatchStats {
  const today = new Date();
  const seeded = parseISO(seedDate);
  const ageDays = differenceInDays(today, seeded);

  const currentStage =
    stages.find((s) => ageDays >= s.day_from && ageDays <= s.day_to) ?? null;

  const daysUntilHarvest = Math.max(0, plant.harvest_days - ageDays);

  return {
    ageDays,
    currentStage,
    ppmMin: currentStage?.ppm_min ?? null,
    ppmMax: currentStage?.ppm_max ?? null,
    phMin: plant.ph_min,
    phMax: plant.ph_max,
    daysUntilHarvest,
  };
}
