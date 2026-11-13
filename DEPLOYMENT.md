# Deployment SiPinjam Kampus

Panduan deployment **Aplikasiweb (SiPinjam Kampus)** ke VPS Ubuntu 24.04 LTS
dengan Nginx host sebagai reverse proxy dan SSL termination, sedangkan
aplikasi berjalan di Docker.

---

## 0. Ringkasan Arsitektur

```
Internet (80/443)
   │
   ▼
Nginx host Ubuntu (SSL Let's Encrypt, security header, rate limit)
   │  ● webisdepinjam.cloud      → 301 ke app.webisdepinjam.cloud
   │  ● www.webisdepinjam.cloud  → 301 ke webisdepinjam.cloud
   │  ● app.webisdepinjam.cloud  → 127.0.0.1:8080 (frontend) + /api → backend
   │  ● api.webisdepinjam.cloud  → 127.0.0.1:8081 (backend)
   ▼
Docker network `aplikasiweb`
   ├─ frontend  (nginx:1.27-alpine, React 19 build Vite)
   ├─ backend   (php:8.4-fpm-alpine + nginx internal + supervisor, Laravel 13)
   ├─ nginx     (nginx internal, routing /api & /errors; tidak dipublikasikan)
   └─ redis     (cache + session; tanpa port publik)
   │
   ▼
Supabase PostgreSQL (eksternal, TLS)
```

**Strategi API: same-origin.** Frontend memanggil `/api/...` pada origin
`app.webisdepinjam.cloud`; Nginx host meneruskan ke container backend.
Bundle production tidak berisi `localhost` maupun URL absolut, dan CORS
tidak dibutuhkan. Alternatif `VITE_BACKEND_URL=https://api.webisdepinjam.cloud`
tetap didukung bila diperlukan.

**Database:** PostgreSQL Supabase (dikonfirmasi dari `backend/.env` +
`config/database.php`), **bukan** container. Karena itu tidak ada container
database dan tidak ada volume database (lihat bagian Backup).

| Port host | Dipakai oleh | Terbuka ke internet? |
|---|---|---|
| 22/tcp | SSH | Ya (UFW) |
| 80/tcp | Nginx host | Ya (UFW, redirect ke 443) |
| 443/tcp | Nginx host | Ya (UFW) |
| 127.0.0.1:8080 | frontend container | **Tidak** (loopback) |
| 127.0.0.1:8081 | backend container | **Tidak** (loopback) |
| 6379 | Redis | **Tidak** (hanya network Docker) |
| 5432 | Supabase | Dikelola Supabase |

---

## 1. Persyaratan VPS

- Ubuntu **24.04 LTS**, akses `sudo`.
- RAM minimal **2 GB** (disarankan 2 GB + swap 2 GB untuk build image).
- Disk minimal **20 GB**.
- Docker Engine **24+** dan Docker Compose **v2**.
- Nginx native, Certbot, Git.
- Domain `webisdepinjam.cloud`, `www`, `app`, `api` mengarah ke IP VPS
  (sudah dikonfigurasi).
- Akun Supabase dengan host/port/database/username/password (Session
  Pooler atau Direct Connection).

Cek cepat:

```bash
lsb_release -a          # Ubuntu 24.04
free -h                 # >= 2 GB
df -h /                 # >= 20 GB bebas
```

Jika RAM 2 GB, tambahkan swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 2. Instalasi Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"   # logout/login agar berlaku
docker compose version
```

Penting: **docker may not bind port 80/443**. Konfigurasi compose di repo
sudah memastikan container hanya memakai `127.0.0.1:8080` dan `:8081`.

---

## 3. Clone Repository

```bash
sudo mkdir -p /var/www/aplikasiweb
sudo chown "$USER":"$USER" /var/www/aplikasiweb

git clone https://github.com/<USERNAME>/<REPO>.git /var/www/aplikasiweb
cd /var/www/aplikasiweb
git checkout main
```

Struktur penting:

```
compose.yaml
.env.example            # variabel compose (port, tag image)
deploy/nginx/           # konfigurasi Nginx host
backend/.env.example    # variabel Laravel produksi
docker/nginx/           # konfigurasi nginx internal container
```

---

## 4. Pembuatan `.env` Production

Ada **dua** file environment:

### 4.1 `.env` root (dibaca Docker Compose)

```bash
cd /var/www/aplikasiweb
cp .env.example .env
chmod 600 .env
```

Isi (default sudah sesuai, ubah bila perlu):

```dotenv
FRONTEND_PORT=8080
BACKEND_PORT=8081
APP_URL=https://api.webisdepinjam.cloud
FRONTEND_URL=https://app.webisdepinjam.cloud
VITE_BACKEND_URL=
VITE_ERROR_PAGE_URL=
IMAGE_TAG=latest
AUTO_MIGRATE=false
```

### 4.2 `backend/.env` (dibaca container Laravel)

```bash
cp backend/.env.example backend/.env
chmod 600 backend/.env
```

Nilai wajib diisi:

```dotenv
APP_NAME="SiPinjam"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.webisdepinjam.cloud
FRONTEND_URL=https://app.webisdepinjam.cloud

# Supabase → Project Settings → Database
DB_CONNECTION=pgsql
DB_HOST=aws-0-<region>.pooler.supabase.com   # atau db.<ref>.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.<project-ref>          # sesuaikan dengan host
DB_PASSWORD=<PASSWORD_SUPABASE>
DB_SSLMODE=require

CACHE_STORE=redis
SESSION_DRIVER=redis
SESSION_SECURE_COOKIE=true
REDIS_HOST=redis
REDIS_PORT=6379

LOG_CHANNEL=stderr
LOG_LEVEL=warning
QUEUE_CONNECTION=sync

# Mail (fitur lupa password)
MAIL_MAILER=smtp
MAIL_SCHEME=tls
MAIL_HOST=smtp.<provider>
MAIL_PORT=587
MAIL_USERNAME=<...>
MAIL_PASSWORD=<...>
MAIL_FROM_ADDRESS=noreply@webisdepinjam.cloud
```

Catatan:

- `REDIS_HOST` **selalu** `redis` (nama service Docker). Compose juga
  memaksakannya, jadi salah isi tidak akan merusak aplikasi.
- `DB_HOST` sangat berpengaruh. Jika memakai **Session Pooler** Supabase,
  umumnya port `5432` dan username `postgres.<project-ref>`; untuk
  **Transaction Pooler** gunakan port `6543` (tidak mendukung prepared
  statement — aplikasi ini memakai query standar sehingga port 5432 lebih
  aman).
- Jangan gunakan `SANCTUM_STATEFUL_DOMAINS` — autentikasi memakai
  **Bearer Token** (`createToken`), bukan cookie session.
- `CORS_ALLOWED_ORIGINS` hanya diperlukan bila memilih strategi direct API.

---

## 5. Generate `APP_KEY` (jika belum ada)

Cara paling aman **tanpa container yang sudah berjalan**:

```bash
cd /var/www/aplikasiweb
docker run --rm php:8.4-cli php -r \
  'echo "base64:".base64_encode(random_bytes(32)).PHP_EOL;'
```

Salin hasilnya ke `backend/.env`:

```dotenv
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
```

Atau via container yang sudah ada:

```bash
docker compose exec backend php artisan key:generate --show
# salin ke backend/.env
docker compose up -d backend   # muat ulang environment
```

> **Jangan** jalankan `key:generate` setelah users login tanpa migrasi
> token, karena token yang dienkripsi/hash memakai APP_KEY akan invalid
> (lihat bagian 16 Rollback). Jika APP_KEY sudah dipakai sebelumnya,
> salin nilai dari server lama.

---

## 6. Build Docker

```bash
cd /var/www/aplikasiweb
docker compose build --no-cache
docker compose up -d
```

Verifikasi:

```bash
docker compose ps
docker compose logs -f --tail=100 backend
```

Yang terjadi saat backend start (lihat `backend/docker/entrypoint.sh`):

1. Menunggu Redis tersedia.
2. Membuat symlink `public/storage`.
3. Merapikan permission `storage/` & `bootstrap/cache/`.
4. `config:cache`, `route:cache`, `event:cache` **dibangun ulang** dari
   environment runtime (nilai rahasia tidak pernah masuk image).
5. Migrasi **tidak** dijalankan otomatis (kecuali `AUTO_MIGRATE=true`).
6. Menjalankan php-fpm + nginx internal via supervisor.

Health check:

```bash
curl -fsS http://127.0.0.1:8081/up && echo OK     # backend
curl -fsS http://127.0.0.1:8080/healthz && echo OK # frontend
```

---

## 7. Migrasi Database (Prosedur Aman)

Database berada di Supabase. **Selalu backup sebelum migrasi.**

```bash
# 1. Cek status migrasi
docker compose exec backend php artisan migrate:status

# 2. DRY-RUN melihat SQL yang akan dijalankan
docker compose exec backend php artisan migrate --pretend

# 3. BACKUP dulu (lihat bagian 14), baru:
docker compose exec backend php artisan migrate --force

# 4. Bersihkan cache hanya bila metadata berubah
docker compose exec backend php artisan optimize:clear
docker compose exec backend php artisan optimize
```

Aturan:

- **Jangan** `migrate:fresh` / `migrate:refresh` / `db:wipe` di production.
- Jalankan migrasi saat **traffic rendah**.
- Migrasi yang menghapus kolom sebaiknya dilakukan dua tahap
  (deploy kode yang tidak memakai kolom → deploy penghapusan).
- Jika `AUTO_MIGRATE=true` diaktifkan, migrasi berjalan saat container
  start. Gunakan hanya untuk instance baru.

---

## 8. Konfigurasi Nginx Ubuntu

### 8.1 Sertifikat Let's Encrypt

Sertifikat sudah diterbitkan Certbot. **Verifikasi path yang sebenarnya**
(jangan mengasumsikan nama direktori):

```bash
sudo ls -1 /etc/letsencrypt/live/
sudo certbot certificates
```

Harus terlihat:

```
/etc/letsencrypt/live/webisdepinjam.cloud/fullchain.pem
/etc/letsencrypt/live/webisdepinjam.cloud/privkey.pem
/etc/letsencrypt/live/www.webisdepinjam.cloud/fullchain.pem
/etc/letsencrypt/live/www.webisdepinjam.cloud/privkey.pem
/etc/letsencrypt/live/app.webisdepinjam.cloud/fullchain.pem
/etc/letsencrypt/live/app.webisdepinjam.cloud/privkey.pem
/etc/letsencrypt/live/api.webisdepinjam.cloud/fullchain.pem
/etc/letsencrypt/live/api.webisdepinjam.cloud/privkey.pem
```

Bila nama direktori berbeda (mis. `app.webisdepinjam.cloud-0001`), sesuaikan
setiap baris `ssl_certificate` / `ssl_certificate_key` di
`deploy/nginx/*.conf` sebelum menyalin.

Alternatif paling rapi: terbitkan **satu sertifikat** untuk semua domain
lalu arahkan semua file ke path yang sama:

```bash
sudo certbot certonly --nginx \
  -d webisdepinjam.cloud -d www.webisdepinjam.cloud \
  -d app.webisdepinjam.cloud -d api.webisdepinjam.cloud
```

Pastikan juga file bersama tersedia:

```bash
ls /etc/letsencrypt/options-ssl-nginx.conf /etc/letsencrypt/ssl-dhparams.pem
```

### 8.2 Pasang konfigurasi

Ubuntu 24.04 meng-include `/etc/nginx/conf.d/*.conf` DAN
`/etc/nginx/sites-enabled/*` **di dalam blok `http {}`**. Maka:

- `upstreams.conf` (blok `upstream`/`map`) → **`conf.d/`**
- tiga file domain (blok `server`) → **`sites-available/` + symlink**

```bash
cd /var/www/aplikasiweb

# Upstream (blok http{}) — BUKAN server block
sudo cp deploy/nginx/upstreams.conf /etc/nginx/conf.d/webisdepinjam-upstreams.conf

# Server block per domain
sudo cp deploy/nginx/webisdepinjam.conf    /etc/nginx/sites-available/webisdepinjam.conf
sudo cp deploy/nginx/app.webisdepinjam.conf /etc/nginx/sites-available/app.webisdepinjam.conf
sudo cp deploy/nginx/api.webisdepinjam.conf /etc/nginx/sites-available/api.webisdepinjam.conf
```

Folder ACME:

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

### 8.3 `nginx.conf` host (sembunyikan versi + gzip)

Pada instalasi Ubuntu, `server_tokens off;` **default-nya dikomentari**.
Buka `/etc/nginx/nginx.conf` dan ubah di dalam blok `http {}`:

```nginx
server_tokens off;
client_max_body_size 50m;
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript
           application/xml text/xml image/svg+xml;
```

> Nginx 1.24 (Ubuntu 24.04) mendukung `http2 on;` — konfigurasi repo sudah
> memakai sintaks baru ini.

---

## 9. Aktivasi `sites-enabled`

Hapus konfigurasi bawaan agar tidak ada `server` default yang menangkap
domain, lalu aktifkan:

```bash
sudo rm -f /etc/nginx/sites-enabled/default

sudo ln -sfn /etc/nginx/sites-available/webisdepinjam.conf   /etc/nginx/sites-enabled/webisdepinjam.conf
sudo ln -sfn /etc/nginx/sites-available/app.webisdepinjam.conf /etc/nginx/sites-enabled/app.webisdepinjam.conf
sudo ln -sfn /etc/nginx/sites-available/api.webisdepinjam.conf /etc/nginx/sites-enabled/api.webisdepinjam.conf

sudo nginx -t
sudo systemctl reload nginx
```

> `upstreams.conf` **tidak** boleh di-`sites-enabled`-kan karena berisi
> blok `upstream`/`map` (bukan `server`).
---

## 10. Pengujian SSL

```bash
# Sertifikat & redirect
curl -I  http://app.webisdepinjam.cloud
curl -I  http://api.webisdepinjam.cloud
curl -I  http://www.webisdepinjam.cloud
curl -I  https://webisdepinjam.cloud

# Verifikasi sertifikat
openssl s_client -connect app.webisdepinjam.cloud:443 -servername app.webisdepinjam.cloud </dev/null 2>/dev/null | openssl x509 -noout -dates -subject

# Header keamanan
curl -sI https://app.webisdepinjam.cloud | grep -Ei "strict-transport|x-content-type|x-frame|server"
```

Yang diharapkan:

- `http://` keempat domain → `301` ke `https://`.
- `www` → `301` ke `https://webisdepinjam.cloud/...`.
- `webisdepinjam.cloud` → `301` ke `https://app.webisdepinjam.cloud/`.
- `Server:` tanpa nomor versi (contoh `nginx` saja).
- `Strict-Transport-Security` ada.

Renewal otomatis (sudah standar Certbot):

```bash
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

Jika memakai `certonly --nginx`, hook reload nginx sudah otomatis. Jika
memakai `--webroot`, pastikan deploy hook ada:

```bash
echo -e '#!/bin/sh\nsystemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## 11. Pengujian API

```bash
# Health
curl -fsS https://api.webisdepinjam.cloud/up -o /dev/null -w "%{http_code}\n"   # 200

# Endpoint publik
curl -sS https://api.webisdepinjam.cloud/api/rooms | head -c 300; echo
curl -sS https://api.webisdepinjam.cloud/api/jadwal | head -c 300; echo

# Validasi login (tanpa kredensial) → 422, bukan 500
curl -sS -o /dev/null -w "%{http_code}\n" -X POST \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{}' https://api.webisdepinjam.cloud/api/login

# Cek X-Forwarded (Laravel harus tahu https)
curl -sS https://api.webisdepinjam.cloud/errors/404 -o /dev/null -w "%{http_code}\n"

# Same-origin lewat frontend
curl -sS https://app.webisdepinjam.cloud/api/rooms | head -c 200; echo
```

Uji login & token asli (ganti dengan akun uji):

```bash
TOKEN=$(curl -sS -X POST https://app.webisdepinjam.cloud/api/login \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"credential":"<nim-atau-email>","password":"<password>"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))')

curl -sS https://app.webisdepinjam.cloud/api/user/me \
  -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json' | head -c 300; echo
```

Uji upload (multipart, maks 5 MB PNG untuk foto):

```bash
curl -sS -X POST https://app.webisdepinjam.cloud/api/user/profile/foto \
  -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json' \
  -F "foto=@/path/foto.png"
```

Aturan saat menguji:

- `413` = melebihi 50 MB (benar).
- `422` = validasi (format/ukuran) — benar.
- `429` = rate limit login (5 percobaan/akun/2 menit dari `LoginRateLimiter`,
  atau 20 request/menit/IP untuk `/api/login|register`). Login normal
  tidak akan terkena.

---

## 12. Pengujian Frontend

```bash
# Halaman utama
curl -sI https://app.webisdepinjam.cloud | head -5

# SPA fallback: route dalam (deep link) harus 200 + index.html
curl -s https://app.webisdepinjam.cloud/login | head -c 120; echo

# Aset ter-cache (dari nama file di halaman)
ASSET=$(curl -s https://app.webisdepinjam.cloud | grep -o '/assets/[^"]*\.js' | head -1)
curl -sI "https://app.webisdepinjam.cloud$ASSET" | grep -Ei "content-type|cache-control|content-encoding"

# Pastikan bundle tidak memuat localhost
curl -s "https://app.webisdepinjam.cloud$ASSET" | grep -c "localhost:8000" || true   # harus 0
```

Di browser:

1. Buka `https://app.webisdepinjam.cloud` — tidak ada warning Mixed Content.
2. Refresh di route dalam (contoh `/login`, `/admin`) — tidak 404.
3. DevTools → Network: request API mengarah ke `https://app.webisdepinjam.cloud/api/...`
   (same-origin), bukan `localhost`.
4. Upload foto profil → gambar tampil (URL `https://api.webisdepinjam.cloud/storage/...`).
5. Tidak ada error MIME type (`application/json` untuk API).

Log:

```bash
docker compose logs -f frontend nginx backend
sudo tail -f /var/log/nginx/app.webisdepinjam.error.log
```

---

## 13. Docker Restart Policy

Compose sudah memakai `restart: unless-stopped` untuk **semua** service.

```bash
docker compose ps                         # lihat status & health
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' aplikasiweb-backend
```

- Container otomatis start setelah reboot VPS (kecuali di-stop manual).
- Boot Docker: `sudo systemctl enable docker`.
- `backend` menunggu `redis` sehat; `nginx` internal menunggu `backend`
  dan `frontend` sehat.
- Log dibatasi (json-file `max-size`/`max-file`) agar disk tidak penuh.

Monitoring cepat:

```bash
docker stats --no-stream
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
```

---

## 14. Backup Database

Database di Supabase. Buat dua lapis backup:

### 14.1 Backup dari VPS (dump logis)

```bash
sudo apt install -y postgresql-client

# Muat variabel DB dari backend/.env
set -a; . /var/www/aplikasiweb/backend/.env; set +a

mkdir -p /var/backups/sipinjam
STAMP=$(date +%F_%H%M)

PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" \
  --no-owner --no-privileges --format=custom \
  -f "/var/backups/sipinjam/sipinjam_${STAMP}.dump"

pg_restore --list "/var/backups/sipinjam/sipinjam_${STAMP}.dump" | head
```

Jalankan berkala (contoh cron harian 02:30, simpan 14 hari):

```cron
30 2 * * * cd /var/www/aplikasiweb && set -a && . backend/.env && set +a && \
  PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" \
  --no-owner --no-privileges --format=custom -f "/var/backups/sipinjam/sipinjam_$(date +\%F_\%H\%M).dump" \
  && find /var/backups/sipinjam -name '*.dump' -mtime +14 -delete
```

### 14.2 Backup upload pengguna (volume `storage`)

```bash
docker run --rm \
  -v aplikasiweb_backend_storage:/data:ro \
  -v /var/backups/sipinjam:/backup \
  alpine sh -c "cd /data && tar czf /backup/storage_$(date +%F_%H%M).tar.gz ."
```

### 14.3 Backup Redis (opsional)

Cache & session bisa hilang tanpa kehilangan data bisnis (user hanya perlu
login ulang). Jika ingin:

```bash
docker compose exec -T redis redis-cli --no-raw BGSAVE
# atau: docker run --rm -v aplikasiweb_redis_data:/data -v /var/backups:/b alpine tar czf /b/redis.tar.gz -C /data .
```

### 14.4 Restore

```bash
set -a; . /var/www/aplikasiweb/backend/.env; set +a

PGPASSWORD="$DB_PASSWORD" pg_restore \
  -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" \
  --clean --if-exists --no-owner --no-privileges \
  /var/backups/sipinjam/sipinjam_<STAMP>.dump

docker run --rm \
  -v aplikasiweb_backend_storage:/data \
  -v /var/backups/sipinjam:/backup \
  alpine sh -c "cd /data && tar xzf /backup/storage_<STAMP>.tar.gz"
```

> Uji restore ke project Supabase **staging** minimal sekali sebelum
> benar-benar dibutuhkan.

---

## 15. Update Aplikasi (Git Pull)

Flow standar (dengan rollback siap):

```bash
cd /var/www/aplikasiweb

# 1. Backup (wajib bila ada migrasi)
/usr/local/bin/sipinjam-backup.sh    # atau jalankan perintah bagian 14

# 2. Tag image versi sekarang untuk rollback
CURRENT=$(date +%F_%H%M)
docker tag aplikasiweb-backend:latest  aplikasiweb-backend:$CURRENT
docker tag aplikasiweb-frontend:latest aplikasiweb-frontend:$CURRENT

# 3. Ambil kode baru
git fetch origin
git log --oneline HEAD..origin/main          # tinjau perubahan
git pull --ff-only origin main

# 4. Cek apakah ada migrasi baru
git diff --name-only HEAD@{1} HEAD -- backend/database/migrations

# 5. Build ulang & jalankan
docker compose build
docker compose up -d --remove-orphans

# 6. Migrasi (hanya bila ada), setelah backup
docker compose exec backend php artisan migrate --force

# 7. Optimasi ulang (config cache dibangun ulang otomatis saat start)
docker compose exec backend php artisan optimize

# 8. Verifikasi
docker compose ps
curl -fsS https://api.webisdepinjam.cloud/up -o /dev/null -w "%{http_code}\n"
```

Frontend: karena `VITE_*` dibaca saat **build**, setiap perubahan
`VITE_BACKEND_URL` memerlukan `docker compose build frontend`.

---

## 16. Rollback jika Deployment Gagal

### A. Rollback cepat (kode + image)

```bash
cd /var/www/aplikasiweb

# Kembalikan source ke commit sebelumnya
git log --oneline -5
git checkout <COMMIT_SEBELUMNYA>

# Pakai kembali image yang sudah di-tag pada langkah 15
docker compose build
docker compose up -d
# atau tanpa build: tag image lama sebagai latest
docker tag aplikasiweb-backend:<TAG>  aplikasiweb-backend:latest
docker tag aplikasiweb-frontend:<TAG> aplikasiweb-frontend:latest
docker compose up -d --force-recreate
```

### B. Rollback migrasi

Laravel `migrate:rollback` **hanya aman** bila migrasi baru memang punya
`down()` yang benar dan belum ada data baru yang bergantung padanya.
Untuk perubahan destruktif, restore backup database (bagian 14.4) lebih
aman daripada rollback otomatis.

```bash
docker compose exec backend php artisan migrate:status
docker compose exec backend php artisan migrate:rollback --step=1   # hati-hati!
```

### C. Kembalikan upload lama

```bash
docker run --rm -v aplikasiweb_backend_storage:/data \
  -v /var/backups/sipinjam:/backup \
  alpine sh -c "cd /data && tar xzf /backup/storage_<STAMP>.tar.gz"
```

### D. Kembalikan ke `main` setelah investigasi

```bash
git checkout main
git pull --ff-only
docker compose build && docker compose up -d
```

---

## Lampiran A — Perintah Operasional

```bash
cd /var/www/aplikasiweb

docker compose ps                                     # status
docker compose logs -f --tail=200 backend             # log Laravel (stderr)
docker compose exec backend php artisan about         # versi & env efektif
docker compose exec backend php artisan route:list    # daftar route
docker compose exec backend php artisan tinker        # shell
docker compose exec redis redis-cli -n 1 DBSIZE       # ukuran cache

docker compose restart backend                        # restart 1 service
docker compose down                                   # stop (volume TETAP)
docker compose down -v                                # ⚠️ HAPUS volume — jangan
```

**Jangan** menjalankan `docker compose down -v`, `docker system prune --volumes`,
atau `docker volume rm aplikasiweb_backend_storage` di production.

## Lampiran B — Troubleshooting

| Gejala | Kemungkinan penyebab | Tindakan |
|---|---|---|
| `502 Bad Gateway` di app | container frontend mati | `docker compose ps`, `docker compose logs frontend` |
| `/api` 502 | backend tidak sehat | `docker compose logs backend`; cek `DB_*` Supabase |
| `500` saat login, log "could not find driver" | ekstensi pgsql | sudah terpasang di image; build ulang `docker compose build backend` |
| Aset memakai `http://` | header `X-Forwarded-Proto` hilang | pastikan memakai `deploy/nginx/*.conf` (bukan proxy lokal) |
| Upload 413 | melebihi 50 MB | perbesar `client_max_body_size`, php.ini, `MAX_CONTENT_LENGTH` bersamaan |
| Upload 500 `PostTooLargeException` | `post_max_size` PHP | sesuaikan `backend/docker/php.ini` |
| Gambar profil 404 | symlink storage hilang | `docker compose exec backend php artisan storage:link` |
| Cookie/session hilang | `SESSION_SECURE_COOKIE` + akses HTTP | akses selalu via HTTPS |
| `429` saat login | rate limit Laravel (5/akun) | tunggu 2 menit; cek `LoginRateLimiter` |
| Error "Target class [login] not found" atau redirect login tidak jelas | Laravel 13 mencoba redirect ke route `login` pada guest | rute di project hanya API; sudah ditangani `redirectGuestsTo(null)` di `bootstrap/app.php` | — |
| Port 80 sudah dipakai | Nginx host & Docker bentrok | pastikan compose tidak memakai `80:80` |

## Lampiran C — Pemeriksaan Keamanan

- [ ] `.env` dan `backend/.env` tidak ada di Git (`git ls-files | grep env`).
- [ ] `APP_DEBUG=false`, `APP_ENV=production` (dipaksa Compose).
- [ ] `APP_KEY` unik dan hanya ada di server.
- [ ] Port 8080/8081 hanya `127.0.0.1` (`docker compose ps`).
- [ ] Redis tanpa port publik.
- [ ] UFW hanya `22,80,443`.
- [ ] `server_tokens off` di Nginx host & container.
- [ ] Security header aktif (`curl -sI`).
- [ ] Login ter-rate-limit (5 akun / 20 IP per menit) tanpa mengganggu login normal.
- [ ] Upload dibatasi 50 MB pada Nginx host, nginx container, php.ini, dan Laravel.
- [ ] Endpoint `/storage` (Laravel) tidak diekspos di production.
- [ ] Bundle frontend tanpa `localhost`.
- [ ] Backup harian berjalan dan pernah diuji restore.
