import { createClient } from "@/lib/supabase/client";
import type { GrowingMethod, PlantStageStatus, SoilCondition, ApplicationMethod } from "@/types";

interface CreateBatchInput {
  name: string;
  plant_id: string;
  seed_date: string;
  hole_count: number;
  growing_method?: GrowingMethod;
  current_stage?: PlantStageStatus;
}

export interface PhotoInput {
  file: File;
  description: string;
}

interface CreateLogInput {
  batch_id: string;
  ppm_actual?: number | null;
  ph_actual?: number | null;
  note?: string | null;
  watered_today?: boolean | null;
  water_amount_ml?: number | null;
  soil_condition?: SoilCondition | null;
  plant_height_cm?: number | null;
  fertilizer_name?: string | null;
  fertilizer_amount?: string | null;
  application_method?: ApplicationMethod | null;
  problem_name?: string | null;
  treatment?: string | null;
  photos?: PhotoInput[];
}

interface HarvestInput {
  batch_id: string;
  weight_kg: number;
  note?: string;
}

export async function createBatch(input: CreateBatchInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("batches")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBatch(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("batches").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateBatchStage(batchId: string, stage: PlantStageStatus) {
  const supabase = createClient();
  const { error } = await supabase
    .from("batches")
    .update({ current_stage: stage })
    .eq("id", batchId);
  if (error) throw new Error(error.message);
}

export async function createDailyLog(input: CreateLogInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { photos, ...logData } = input;

  const { data: log, error } = await supabase
    .from("daily_logs")
    .insert(logData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (photos && photos.length > 0) {
    await uploadLogPhotos(log.id, user.id, photos);
  }

  return log;
}

async function uploadLogPhotos(logId: string, userId: string, photos: PhotoInput[]) {
  const supabase = createClient();

  await Promise.all(
    photos.map(async (photo) => {
      const ext = photo.file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${logId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("log-photos")
        .upload(path, photo.file, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { error: insertError } = await supabase
        .from("log_photos")
        .insert({
          log_id: logId,
          storage_path: path,
          description: photo.description.trim() || null,
        });

      if (insertError) throw new Error(insertError.message);
    })
  );
}

export async function getSignedPhotoUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("log-photos")
    .createSignedUrl(storagePath, 60 * 60);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteLogPhoto(id: string, storagePath: string) {
  const supabase = createClient();

  await supabase.storage.from("log-photos").remove([storagePath]);
  const { error } = await supabase.from("log_photos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteDailyLog(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("daily_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createHarvest(input: HarvestInput) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("harvests")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { error: updateError } = await supabase
    .from("batches")
    .update({ status: "harvested" })
    .eq("id", input.batch_id);

  if (updateError) throw new Error(updateError.message);

  return data;
}
