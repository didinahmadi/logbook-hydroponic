export type BatchStatus = "active" | "harvested";
export type GrowingMethod = "hydroponic" | "soil" | "polybag" | "pot" | "cocopeat";
export type PlantStageStatus = "seedling" | "vegetative" | "flowering" | "fruiting" | "harvesting";
export type SoilCondition = "dry" | "normal" | "wet";
export type ApplicationMethod = "watering" | "spray" | "spread";

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
  growing_method: GrowingMethod;
  current_stage: PlantStageStatus;
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

export interface LogPhotoWithDate extends LogPhoto {
  log_date: string;
}

export interface DailyLog {
  id: string;
  batch_id: string;
  ppm_actual: number | null;
  ph_actual: number | null;
  note: string | null;
  created_at: string;
  watered_today: boolean | null;
  water_amount_ml: number | null;
  soil_condition: SoilCondition | null;
  plant_height_cm: number | null;
  fertilizer_name: string | null;
  fertilizer_amount: string | null;
  application_method: ApplicationMethod | null;
  problem_name: string | null;
  treatment: string | null;
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

export type TimelineEvent =
  | { type: "log"; date: string; data: DailyLog }
  | { type: "harvest"; date: string; data: Harvest };
