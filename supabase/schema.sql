-- ============================================================
-- Hydroponic Logbook — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- PLANTS
create table public.plants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  harvest_days integer not null,
  ph_min numeric(4,2) not null,
  ph_max numeric(4,2) not null,
  description text,
  created_at timestamptz default now()
);

-- PLANT STAGES
create table public.plant_stages (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  day_from integer not null,
  day_to integer not null,
  ppm_min integer not null,
  ppm_max integer not null
);

-- BATCHES
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  plant_id uuid not null references public.plants(id),
  seed_date date not null,
  hole_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'harvested')),
  created_at timestamptz default now()
);

-- DAILY LOGS
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  ppm_actual numeric(8,2) not null,
  ph_actual numeric(4,2) not null,
  note text,
  created_at timestamptz default now()
);

-- LOG PHOTOS
create table public.log_photos (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.daily_logs(id) on delete cascade,
  storage_path text not null,
  description text,
  created_at timestamptz default now()
);

-- HARVESTS
create table public.harvests (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  weight_kg numeric(8,3) not null,
  note text,
  harvested_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.plants enable row level security;
alter table public.plant_stages enable row level security;
alter table public.batches enable row level security;
alter table public.daily_logs enable row level security;
alter table public.log_photos enable row level security;
alter table public.harvests enable row level security;

-- Plants: public read
create policy "Plants are public read"
  on public.plants for select
  using (true);

-- Plant stages: public read
create policy "Plant stages are public read"
  on public.plant_stages for select
  using (true);

-- Batches: users own their data
create policy "Users can view own batches"
  on public.batches for select
  using (auth.uid() = user_id);

create policy "Users can insert own batches"
  on public.batches for insert
  with check (auth.uid() = user_id);

create policy "Users can update own batches"
  on public.batches for update
  using (auth.uid() = user_id);

create policy "Users can delete own batches"
  on public.batches for delete
  using (auth.uid() = user_id);

-- Daily logs: users own their data via batch ownership
create policy "Users can view own daily logs"
  on public.daily_logs for select
  using (
    exists (
      select 1 from public.batches
      where batches.id = daily_logs.batch_id
        and batches.user_id = auth.uid()
    )
  );

create policy "Users can insert own daily logs"
  on public.daily_logs for insert
  with check (
    exists (
      select 1 from public.batches
      where batches.id = daily_logs.batch_id
        and batches.user_id = auth.uid()
    )
  );

create policy "Users can update own daily logs"
  on public.daily_logs for update
  using (
    exists (
      select 1 from public.batches
      where batches.id = daily_logs.batch_id
        and batches.user_id = auth.uid()
    )
  );

create policy "Users can delete own daily logs"
  on public.daily_logs for delete
  using (
    exists (
      select 1 from public.batches
      where batches.id = daily_logs.batch_id
        and batches.user_id = auth.uid()
    )
  );

-- Harvests: users own their data via batch ownership
create policy "Users can view own harvests"
  on public.harvests for select
  using (
    exists (
      select 1 from public.batches
      where batches.id = harvests.batch_id
        and batches.user_id = auth.uid()
    )
  );

create policy "Users can insert own harvests"
  on public.harvests for insert
  with check (
    exists (
      select 1 from public.batches
      where batches.id = harvests.batch_id
        and batches.user_id = auth.uid()
    )
  );

-- Log photos: access via log → batch ownership
create policy "Users can view own log photos"
  on public.log_photos for select
  using (
    exists (
      select 1 from public.daily_logs dl
      join public.batches b on b.id = dl.batch_id
      where dl.id = log_photos.log_id
        and b.user_id = auth.uid()
    )
  );

create policy "Users can insert own log photos"
  on public.log_photos for insert
  with check (
    exists (
      select 1 from public.daily_logs dl
      join public.batches b on b.id = dl.batch_id
      where dl.id = log_photos.log_id
        and b.user_id = auth.uid()
    )
  );

create policy "Users can delete own log photos"
  on public.log_photos for delete
  using (
    exists (
      select 1 from public.daily_logs dl
      join public.batches b on b.id = dl.batch_id
      where dl.id = log_photos.log_id
        and b.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'log-photos',
  'log-photos',
  false,
  5242880,  -- 5 MB per file
  '{image/jpeg,image/png,image/webp,image/gif}'
) on conflict (id) do nothing;

create policy "Users can upload own log photos"
  on storage.objects for insert
  with check (
    bucket_id = 'log-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own log photos in storage"
  on storage.objects for select
  using (
    bucket_id = 'log-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own log photos in storage"
  on storage.objects for delete
  using (
    bucket_id = 'log-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- SEED DATA
-- ============================================================

insert into public.plants (id, name, harvest_days, ph_min, ph_max, description) values
  ('11111111-1111-1111-1111-111111111111', 'Pakcoy',   35, 5.5, 6.5, 'Sayuran hijau populer untuk hidroponik, tumbuh cepat dan mudah dirawat'),
  ('22222222-2222-2222-2222-222222222222', 'Selada',   30, 5.5, 6.5, 'Selada hijau segar, cocok untuk sistem NFT dan DWC'),
  ('33333333-3333-3333-3333-333333333333', 'Kangkung', 21, 5.5, 6.5, 'Tumbuh sangat cepat, ideal untuk pemula hidroponik'),
  ('44444444-4444-4444-4444-444444444444', 'Bayam',    25, 6.0, 7.0, 'Kaya nutrisi, tumbuh baik di sistem hidroponik'),
  ('55555555-5555-5555-5555-555555555555', 'Brokoli',  70, 6.0, 7.0, 'Sayuran cruciferous kaya vitamin, butuh nutrisi lebih tinggi di fase pembentukan kepala'),
  ('66666666-6666-6666-6666-666666666666', 'Cabe',     90, 5.5, 6.5, 'Tanaman buah pedas, butuh nutrisi tinggi di fase berbunga dan berbuah'),
  ('77777777-7777-7777-7777-777777777777', 'Tomat',    80, 5.5, 6.5, 'Buah populer yang tumbuh baik di sistem DWC dan NFT, butuh support saat berbuah');

-- Pakcoy stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('11111111-1111-1111-1111-111111111111', 1, 7, 500, 700),
  ('11111111-1111-1111-1111-111111111111', 8, 14, 800, 1000),
  ('11111111-1111-1111-1111-111111111111', 15, 25, 1000, 1200),
  ('11111111-1111-1111-1111-111111111111', 26, 35, 1200, 1400);

-- Selada stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('22222222-2222-2222-2222-222222222222', 1, 7, 400, 600),
  ('22222222-2222-2222-2222-222222222222', 8, 14, 700, 900),
  ('22222222-2222-2222-2222-222222222222', 15, 30, 900, 1100);

-- Kangkung stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('33333333-3333-3333-3333-333333333333', 1, 7, 600, 800),
  ('33333333-3333-3333-3333-333333333333', 8, 21, 1000, 1400);

-- Bayam stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('44444444-4444-4444-4444-444444444444', 1,  7,  500,  700),
  ('44444444-4444-4444-4444-444444444444', 8,  15, 800,  1000),
  ('44444444-4444-4444-4444-444444444444', 16, 25, 1000, 1300);

-- Brokoli stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('55555555-5555-5555-5555-555555555555', 1,  14, 500,  800),
  ('55555555-5555-5555-5555-555555555555', 15, 35, 1000, 1400),
  ('55555555-5555-5555-5555-555555555555', 36, 55, 1400, 1800),
  ('55555555-5555-5555-5555-555555555555', 56, 70, 1600, 2000);

-- Cabe stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('66666666-6666-6666-6666-666666666666', 1,  14, 700,  900),   -- semai
  ('66666666-6666-6666-6666-666666666666', 15, 35, 1000, 1400),  -- vegetatif
  ('66666666-6666-6666-6666-666666666666', 36, 65, 1400, 1800),  -- berbunga & berbuah
  ('66666666-6666-6666-6666-666666666666', 66, 90, 1800, 2200);  -- pematangan buah

-- Tomat stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('77777777-7777-7777-7777-777777777777', 1,  14, 700,  900),   -- semai
  ('77777777-7777-7777-7777-777777777777', 15, 30, 1200, 1500),  -- vegetatif
  ('77777777-7777-7777-7777-777777777777', 31, 55, 1500, 2000),  -- berbunga & pembentukan buah
  ('77777777-7777-7777-7777-777777777777', 56, 80, 2000, 2500);  -- pematangan
