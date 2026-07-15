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
  growing_method text not null default 'hydroponic' check (growing_method in ('hydroponic', 'soil', 'polybag', 'pot', 'cocopeat')),
  current_stage text not null default 'seedling' check (current_stage in ('seedling', 'vegetative', 'flowering', 'fruiting', 'harvesting')),
  created_at timestamptz default now()
);

-- DAILY LOGS
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  ppm_actual numeric(8,2),
  ph_actual numeric(4,2),
  note text,
  watered_today boolean,
  water_amount_ml integer,
  soil_condition text check (soil_condition in ('dry', 'normal', 'wet')),
  plant_height_cm numeric(6,1),
  fertilizer_name text,
  fertilizer_amount text,
  application_method text check (application_method in ('watering', 'spray', 'spread')),
  problem_name text,
  treatment text,
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
  ('11111111-1111-1111-1111-111111111111', 'Pakcoy',   35,  5.5, 6.5, 'Sayuran hijau populer untuk hidroponik, tumbuh cepat dan mudah dirawat'),
  ('22222222-2222-2222-2222-222222222222', 'Selada',   30,  5.5, 6.5, 'Selada hijau segar, cocok untuk sistem NFT dan DWC'),
  ('33333333-3333-3333-3333-333333333333', 'Kangkung', 21,  5.5, 6.5, 'Tumbuh sangat cepat, ideal untuk pemula hidroponik'),
  ('44444444-4444-4444-4444-444444444444', 'Bayam',    25,  6.0, 7.0, 'Kaya nutrisi, tumbuh baik di sistem hidroponik'),
  ('55555555-5555-5555-5555-555555555555', 'Brokoli',  70,  6.0, 7.0, 'Sayuran cruciferous kaya vitamin, butuh nutrisi lebih tinggi di fase pembentukan kepala'),
  ('66666666-6666-6666-6666-666666666666', 'Cabe',     90,  5.5, 6.5, 'Tanaman buah pedas, butuh nutrisi tinggi di fase berbunga dan berbuah'),
  ('77777777-7777-7777-7777-777777777777', 'Tomat',    80,  5.5, 6.5, 'Buah populer yang tumbuh baik di sistem DWC dan NFT, butuh support saat berbuah'),
  ('88888888-8888-8888-8888-888888888888', 'Melon',     90,  5.5, 6.8, 'Buah manis populer, butuh nutrisi tinggi saat pembentukan dan pematangan buah'),
  ('99999999-9999-9999-9999-999999999999', 'Anggur',   150, 6.0, 6.5, 'Buah merambat cocok untuk polybag dan lahan kecil, butuh pruning rutin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zukini',      55,  6.0, 7.0, 'Sayuran buah tumbuh cepat, produktif, cocok untuk pot besar atau polybag'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mentimun',   45,  5.5, 6.5, 'Tumbuh merambat, butuh ajir, hasil panen cepat dan melimpah'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Buncis',     60,  6.0, 7.0, 'Polong hijau bergizi, cocok untuk sistem NFT atau polybag'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Paprika',    90,  6.0, 6.5, 'Paprika manis warna-warni, butuh sinar matahari penuh dan nutrisi stabil'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Sawi Putih', 45,  6.0, 7.0, 'Sayuran daun renyah populer untuk tumisan dan sup, tumbuh cepat di iklim sejuk'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Semangka',   80,  5.5, 6.5, 'Buah besar berair, butuh lahan atau polybag besar dan sinar matahari penuh');

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

-- Melon stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('88888888-8888-8888-8888-888888888888', 1,  14, 600,  800),   -- semai
  ('88888888-8888-8888-8888-888888888888', 15, 35, 900,  1200),  -- vegetatif
  ('88888888-8888-8888-8888-888888888888', 36, 65, 1400, 1800),  -- berbunga & pembentukan buah
  ('88888888-8888-8888-8888-888888888888', 66, 90, 1800, 2200);  -- pematangan

-- Anggur stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('99999999-9999-9999-9999-999999999999', 1,   20,  600,  900),   -- semai & akar
  ('99999999-9999-9999-9999-999999999999', 21,  60,  900,  1300),  -- vegetatif & sulur
  ('99999999-9999-9999-9999-999999999999', 61,  100, 1300, 1700),  -- berbunga
  ('99999999-9999-9999-9999-999999999999', 101, 150, 1600, 2000);  -- pembentukan & pematangan buah

-- Zukini stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1,  14, 600,  900),   -- semai
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 15, 30, 1000, 1400),  -- vegetatif
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 31, 55, 1400, 1800);  -- berbunga & berbuah

-- Mentimun stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1,  10, 500,  800),   -- semai
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 11, 25, 900,  1200),  -- vegetatif & merambat
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 26, 45, 1200, 1600);  -- berbunga & berbuah

-- Buncis stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 1,  14, 500,  800),   -- semai
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 15, 35, 900,  1200),  -- vegetatif
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 36, 60, 1200, 1600);  -- berbunga & polong

-- Paprika stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1,  14, 700,  900),   -- semai
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 15, 40, 1000, 1400),  -- vegetatif
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 41, 65, 1400, 1800),  -- berbunga
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 66, 90, 1800, 2200);  -- pembentukan & pematangan buah

-- Sawi Putih stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1,  10, 500,  700),   -- semai
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 11, 25, 800,  1000),  -- vegetatif
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 26, 45, 1000, 1300);  -- pembentukan krop

-- Semangka stages
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 1,  14, 600,  900),   -- semai
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 15, 35, 1000, 1400),  -- vegetatif & merambat
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 36, 60, 1400, 1800),  -- berbunga & setting buah
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 61, 80, 1600, 2000);  -- pematangan buah
