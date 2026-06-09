-- =============================================================
-- Migration 001: Evolve to General Gardening Logbook
-- Apply to running container: docker exec -i supabase-db psql -U postgres -d postgres -f -
-- Or run each block separately via docker exec -i supabase-db psql -U postgres -d postgres -c "..."
-- =============================================================

-- Add growing method and current stage to batches
alter table public.batches
  add column if not exists growing_method text not null default 'hydroponic'
    check (growing_method in ('hydroponic', 'soil', 'polybag', 'pot', 'cocopeat')),
  add column if not exists current_stage text not null default 'seedling'
    check (current_stage in ('seedling', 'vegetative', 'flowering', 'fruiting', 'harvesting'));

-- Make PPM and pH optional (soil/polybag growers don't measure these)
alter table public.daily_logs
  alter column ppm_actual drop not null,
  alter column ph_actual drop not null;

-- Add new tracking columns to daily_logs
alter table public.daily_logs
  add column if not exists watered_today boolean,
  add column if not exists water_amount_ml integer,
  add column if not exists soil_condition text
    check (soil_condition in ('dry', 'normal', 'wet')),
  add column if not exists plant_height_cm numeric(6,1),
  add column if not exists fertilizer_name text,
  add column if not exists fertilizer_amount text,
  add column if not exists application_method text
    check (application_method in ('watering', 'spray', 'spread')),
  add column if not exists problem_name text,
  add column if not exists treatment text;
