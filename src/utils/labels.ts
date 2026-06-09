import type { GrowingMethod, PlantStageStatus, SoilCondition, ApplicationMethod } from "@/types";

export const GROWING_METHOD_LABELS: Record<GrowingMethod, string> = {
  hydroponic: "Hidroponik",
  soil: "Tanah",
  polybag: "Polybag",
  pot: "Pot",
  cocopeat: "Cocopeat",
};

export const PLANT_STAGE_LABELS: Record<PlantStageStatus, string> = {
  seedling: "Bibit",
  vegetative: "Vegetatif",
  flowering: "Berbunga",
  fruiting: "Berbuah",
  harvesting: "Panen",
};

export const SOIL_CONDITION_LABELS: Record<SoilCondition, string> = {
  dry: "Kering",
  normal: "Normal",
  wet: "Basah",
};

export const APPLICATION_METHOD_LABELS: Record<ApplicationMethod, string> = {
  watering: "Kocor",
  spray: "Semprot",
  spread: "Tabur",
};

export const GROWING_METHODS: GrowingMethod[] = ["hydroponic", "soil", "polybag", "pot", "cocopeat"];
export const PLANT_STAGES: PlantStageStatus[] = ["seedling", "vegetative", "flowering", "fruiting", "harvesting"];
export const SOIL_CONDITIONS: SoilCondition[] = ["dry", "normal", "wet"];
export const APPLICATION_METHODS: ApplicationMethod[] = ["watering", "spray", "spread"];
