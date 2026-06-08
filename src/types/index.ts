export type BatchStatus = "active" | "harvested";

export interface Plant {
  id: string;
  name: string;
  harvest_days: number;
  ph_min: number;
  ph_max: number;
  description: string | null;
}

export interface PlantStage {
  id: string;
  plant_id: string;
  day_from: number;
  day_to: number;
  ppm_min: number;
  ppm_max: number;
}

export interface Batch {
  id: string;
  user_id: string;
  name: string;
  plant_id: string;
  seed_date: string;
  hole_count: number;
  status: BatchStatus;
  created_at: string;
}

export interface BatchWithPlant extends Batch {
  plant: Plant;
}

export interface LogPhoto {
  id: string;
  log_id: string;
  storage_path: string;
  description: string | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  batch_id: string;
  ppm_actual: number;
  ph_actual: number;
  note: string | null;
  created_at: string;
  log_photos?: LogPhoto[];
}

export interface Harvest {
  id: string;
  batch_id: string;
  weight_kg: number;
  note: string | null;
  harvested_at: string;
}

export interface BatchStats {
  ageDays: number;
  currentStage: PlantStage | null;
  ppmMin: number | null;
  ppmMax: number | null;
  phMin: number;
  phMax: number;
  daysUntilHarvest: number;
}
