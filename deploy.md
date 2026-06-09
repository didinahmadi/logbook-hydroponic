Part 1 — Setup Supabase Cloud
1. Buat project

Buka supabase.com → Sign up → New project:

Name: logbook (bebas)
Database Password: buat yang kuat, simpan di password manager
Region: Southeast Asia (Singapore) — paling dekat ke Indonesia
Tunggu ~2 menit sampai provisioning selesai.

2. Jalankan schema

Dashboard → SQL Editor → New query → paste isi file supabase/schema.sql → Run

Ini akan membuat semua tabel, RLS policies, storage bucket, dan seed data tanaman.

3. Verifikasi storage bucket

Sidebar → Storage → pastikan bucket log-photos sudah ada dan Private (tidak public).

Kalau belum ada: New bucket → name: log-photos, biarkan unchecked "Public bucket".

4. Ambil credentials

Sidebar → Project Settings → API:

Copy Project URL (format: https://xxxxxxxxxxxx.supabase.co)
Copy anon public key (string panjang yang diawali eyJ...)
5. Update Auth redirect URL

Sidebar → Authentication → URL Configuration:

Site URL: https://domain-kamu.com
Redirect URLs: tambah https://domain-kamu.com/**
Ini penting agar link konfirmasi email bekerja di domain production.

Part 2 — Konfigurasi App untuk Production
1. Buat file .env.production.local di root project:


NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
Jangan commit file ini ke Git. Pastikan .env.production.local sudah ada di .gitignore.

2. Verifikasi .gitignore:


grep "env" .gitignore
Harus ada baris .env*.local. Kalau belum ada:


echo ".env*.local" >> .gitignore
3. Push ke GitHub/GitLab:


git add .
git commit -m "feat: general gardening evolution - growing method, stages, timeline, gallery"
git remote add origin https://github.com/username/hidroponik-logbook.git
git push -u origin main
Part 3 — Setup VPS (Ubuntu)
SSH ke VPS kamu, lalu jalankan semua langkah ini.

1. Install Node.js 20:


curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # harus v20.x.x
2. Install PM2 dan Nginx:


sudo npm install -g pm2
sudo apt-get install -y nginx
3. Clone dan build app:


# Clone ke /var/www
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/username/hidroponik-logbook.git logbook
sudo chown -R $USER:$USER /var/www/logbook

cd /var/www/logbook

# Buat file env production
nano .env.production.local
Isi .env.production.local:


NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
Simpan dengan Ctrl+O lalu Enter, keluar dengan Ctrl+X.


# Install dependencies dan build
npm install
npm run build
4. Jalankan dengan PM2:


pm2 start npm --name "logbook" -- start

# Cek status
pm2 status

# Simpan config supaya auto-start setelah reboot
pm2 save
pm2 startup
# Jalankan perintah yang ditampilkan di output (dimulai dengan "sudo env PATH=...")
Test dulu: curl http://localhost:3000 — harus return HTML.

Part 4 — Nginx sebagai Reverse Proxy
1. Buat config Nginx:


sudo nano /etc/nginx/sites-available/logbook
Isi:


server {
    listen 80;
    server_name domain-kamu.com www.domain-kamu.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
2. Aktifkan dan test:


sudo ln -s /etc/nginx/sites-available/logbook /etc/nginx/sites-enabled/
sudo nginx -t   # harus: syntax is ok
sudo systemctl reload nginx
3. SSL dengan Certbot:


sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-kamu.com -d www.domain-kamu.com
Ikuti promptnya, masukkan email, setujui terms. Certbot otomatis update config Nginx dengan HTTPS dan set up auto-renewal.

Part 5 — Update App di VPS (untuk deploy berikutnya)
Setiap kali ada update kode:


cd /var/www/logbook
git pull
npm install
npm run build
pm2 restart logbook
Catatan Penting
Hal	Keterangan
Email confirmation	Supabase Cloud wajib konfirmasi email by default (beda dari local dev). User harus klik link di email setelah register.
Free tier auto-pause	Project Supabase gratis di-pause setelah 1 minggu tidak ada traffic. Untuk disable: Settings → General → Pause settings (hanya di paid plan). Workaround gratis: ping DB setiap hari via cron.
File upload limit	Storage gratis 1GB total. Sudah cukup untuk ratusan log foto.
SMTP limit	Supabase gratis: 2 email/jam. Cukup untuk personal use. Kalau butuh lebih, pakai custom SMTP di Settings → Auth → SMTP.
Setelah selesai, app kamu bisa diakses di https://domain-kamu.com. Kalau ada error, cek log dengan:


pm2 logs logbook