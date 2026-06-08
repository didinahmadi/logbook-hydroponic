# Cara Menambah Data Tanaman

Data tanaman di Hidro Logbook tersimpan di dua tabel:

- **`plants`** — data utama tanaman (nama, hari panen, rentang pH)
- **`plant_stages`** — tahapan nutrisi per tanaman (hari ke berapa, target PPM)

---

## Struktur Data

### Tabel `plants`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` | Primary key, gunakan UUID v4 |
| `name` | `text` | Nama tanaman |
| `harvest_days` | `integer` | Estimasi hari sejak semai hingga panen |
| `ph_min` | `numeric(4,2)` | pH minimum larutan nutrisi |
| `ph_max` | `numeric(4,2)` | pH maksimum larutan nutrisi |
| `description` | `text` | Deskripsi singkat (opsional) |

### Tabel `plant_stages`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` | Primary key (auto-generated) |
| `plant_id` | `uuid` | FK ke `plants.id` |
| `day_from` | `integer` | Awal tahap (hari ke-) |
| `day_to` | `integer` | Akhir tahap (hari ke-) |
| `ppm_min` | `integer` | Target PPM minimum |
| `ppm_max` | `integer` | Target PPM maksimum |

> **Aturan tahapan:** `day_from` dan `day_to` harus berurutan dan tidak boleh overlap. Tahap pertama sebaiknya mulai dari hari 1. Tahap terakhir harus berakhir di hari yang sama dengan `harvest_days`.

---

## Cara Menambah Tanaman

### Metode 1: Docker exec (lokal, tanpa restart)

Jalankan dari terminal di direktori project mana saja:

```bash
docker exec -i supabase-db psql -U postgres -d postgres -c "
-- 1. Tambah tanaman
insert into public.plants (id, name, harvest_days, ph_min, ph_max, description)
values (
  gen_random_uuid(),
  'Nama Tanaman',
  30,         -- hari panen
  5.5,        -- pH min
  6.5,        -- pH max
  'Deskripsi singkat tanaman'
);

-- 2. Lihat UUID yang baru dibuat
select id, name from public.plants where name = 'Nama Tanaman';
"
```

Setelah dapat UUID-nya, tambah tahapan:

```bash
docker exec -i supabase-db psql -U postgres -d postgres -c "
insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('UUID-DARI-LANGKAH-SEBELUMNYA', 1,  10, 500,  700),
  ('UUID-DARI-LANGKAH-SEBELUMNYA', 11, 25, 800,  1100),
  ('UUID-DARI-LANGKAH-SEBELUMNYA', 26, 30, 1100, 1400);
"
```

---

### Metode 2: Supabase Studio (lokal)

1. Buka **http://localhost:8000**
2. Login dengan `supabase` / `supabase-local-2024`
3. Pilih menu **Table Editor** di sidebar kiri
4. Pilih tabel **`plants`** → klik **Insert row**
5. Isi semua kolom → klik **Save**
6. Catat `id` yang baru dibuat
7. Pindah ke tabel **`plant_stages`** → tambah baris untuk setiap tahap

Atau gunakan **SQL Editor** (lebih cepat untuk banyak data):

```sql
-- Ganti nilai sesuai kebutuhan
do $$
declare
  plant_id uuid := gen_random_uuid();
begin
  insert into public.plants (id, name, harvest_days, ph_min, ph_max, description)
  values (plant_id, 'Nama Tanaman', 30, 5.5, 6.5, 'Deskripsi');

  insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
    (plant_id, 1,  10, 500,  700),
    (plant_id, 11, 25, 800,  1100),
    (plant_id, 26, 30, 1100, 1400);
end $$;
```

---

### Metode 3: Permanen di seed data (untuk install baru)

Tambahkan di dua file sekaligus agar tanaman otomatis ada saat pertama kali install:

**File 1:** [`supabase/schema.sql`](../supabase/schema.sql) — untuk deploy ke Supabase Cloud

**File 2:** [`docker/volumes/db/init/00-app-schema.sql`](../docker/volumes/db/init/00-app-schema.sql) — untuk Docker lokal

Konvensi UUID seed data di project ini menggunakan pola yang mudah diingat:

```
11111111-1111-1111-1111-111111111111  → Pakcoy
22222222-2222-2222-2222-222222222222  → Selada
33333333-3333-3333-3333-333333333333  → Kangkung
44444444-4444-4444-4444-444444444444  → Bayam
55555555-5555-5555-5555-555555555555  → Brokoli
66666666-6666-6666-6666-666666666666  → Cabe
77777777-7777-7777-7777-777777777777  → Tomat
88888888-8888-8888-8888-888888888888  → (tanaman berikutnya)
```

Contoh lengkap untuk menambah di file seed:

```sql
-- Di bagian SEED DATA
insert into public.plants (id, name, harvest_days, ph_min, ph_max, description) values
  ('88888888-8888-8888-8888-888888888888', 'Timun', 45, 5.5, 6.5, 'Tumbuh cepat, butuh nutrisi sedang')
on conflict (id) do nothing;

insert into public.plant_stages (plant_id, day_from, day_to, ppm_min, ppm_max) values
  ('88888888-8888-8888-8888-888888888888', 1,  14, 500,  800),
  ('88888888-8888-8888-8888-888888888888', 15, 30, 900,  1200),
  ('88888888-8888-8888-8888-888888888888', 31, 45, 1200, 1600)
on conflict do nothing;
```

Setelah edit kedua file, jalankan live migration agar Docker yang sedang berjalan ikut terupdate (lihat Metode 1 di atas).

---

## Referensi PPM & pH Tanaman Umum

| Tanaman | Panen | pH | PPM Awal | PPM Akhir |
|---|---|---|---|---|
| Pakcoy | 35 hari | 5.5–6.5 | 500–700 | 1200–1400 |
| Selada | 30 hari | 5.5–6.5 | 400–600 | 900–1100 |
| Kangkung | 21 hari | 5.5–6.5 | 600–800 | 1000–1400 |
| Bayam | 25 hari | 6.0–7.0 | 500–700 | 1000–1300 |
| Brokoli | 70 hari | 6.0–7.0 | 500–800 | 1600–2000 |
| Cabe | 90 hari | 5.5–6.5 | 700–900 | 1800–2200 |
| Tomat | 80 hari | 5.5–6.5 | 700–900 | 2000–2500 |
| Timun | 45 hari | 5.5–6.5 | 500–800 | 1200–1600 |
| Melon | 90 hari | 5.5–6.5 | 800–1000 | 2000–2500 |
| Stroberi | 90 hari | 5.5–6.5 | 800–1000 | 1200–1400 |

> Angka di atas adalah panduan umum. Sesuaikan dengan kondisi lokal, varietas, dan sistem hidroponik yang digunakan.

---

## Checklist Sebelum Menambah Tanaman

- [ ] `day_to` tahap terakhir = `harvest_days` di tabel `plants`
- [ ] Tidak ada gap antar tahap (misal tahap 1 berakhir hari 14, tahap 2 mulai hari 15)
- [ ] Tidak ada overlap antar tahap
- [ ] PPM naik bertahap dari tahap awal ke akhir
- [ ] pH sesuai kebutuhan spesifik tanaman
- [ ] Jika tambah ke seed file, update **kedua** file sekaligus
