# Halaman Error HTTP (Laravel)

Seluruh halaman error dirender **server-side oleh Laravel**, bukan React.
Ketika backend mati, error tak tertangani, atau upstream nginx gagal, pengguna melihat
satu halaman tampilan yang konsisten (animasi ghost).

## Kode yang didukung

400, 401, 402, 403, 404, 405, 408, 409, 413, 419, 422, 429, 500, 501, 502, 503, 504

## Pratinjau / tes manual

```bash
cd backend
php artisan serve --port=8000
```

| URL | Hasil |
|---|---|
| `/errors/404` | halaman 404 |
| `/errors/500` | halaman 500 |
| `/errors/503` | halaman 503 (server down) |
| `/halaman-tidak-ada` | 404 otomatis dari Laravel |
| `/errors/599` | kode tak didukung → 404 |

Status HTTP sungguhan ikut dikirim (`curl -I /errors/503` → `503`).

## Struktur

| File | Fungsi |
|---|---|
| `config/http_status.php` | teks tiap kode: nama, judul, deskripsi, saran, tombol |
| `resources/views/errors/_page.blade.php` | layout + animasi ghost (HTML/CSS murni) |
| `resources/views/errors/{kode}.blade.php` | pasangan data → layout |
| `bootstrap/app.php` | render callback: error non-JSON memakai view di atas |
| `routes/web.php` | route `/errors/{code}` untuk pratinjau |
| `tests/Feature/ErrorPageTest.php` | test PHPUnit |

Menambah kode baru:

1. tambahkan entri di `config/http_status.php`
2. buat `resources/views/errors/{kode}.blade.php`
3. (opsional) tambahkan kode ke `$errorCodes` di `routes/web.php`

## Alur ketika backend mati

```
Browser → nginx :80
  ├─ /            → container frontend (SPA React)
  ├─ /errors/…    → backend Laravel (Blade)
  └─ /api/…       → backend Laravel (JSON)
        └─ backend tidak menjawab  → nginx `error_page … = @backend_down`
                                   → coba halaman 503 Laravel
                                   → bila Laravel juga mati: /errors/503.html (statis)
```

Cadangan terakhir adalah `public/errors/503.html` yang disajikan nginx langsung
(di-mount ke `/srv/backend-public` lewat `compose.yaml`). Halaman ini tidak butuh
PHP, database, maupun koneksi apa pun.

Untuk pengujian:

```bash
docker compose up -d
docker compose stop backend
curl -i http://localhost/api/rooms      # status 5xx + HTML halaman 503
docker compose start backend
```

### Kode status yang keluar

| Kondisi | Status dari nginx |
|---|---|
| Backend mati / crash | tetap status error yang terdeteksi (umumnya 502), isi = halaman 503 |
| Backend timeout (>10s) | 504, isi = halaman 503 |
| Backend hidup tapi error | 500 / kode aslinya dari Laravel |
| Frontend container mati | 502 (halaman error tidak bisa tampil) |

Catatan: `GET /` diarahkan ke container frontend, jadi mematikan backend tidak
menghasilkan 502 di halaman utama — React tetap terbuka, lalu memanggil
`openBackendErrorPage()` ketika request API gagal.

## Peran React sekarang

React hanya bertugas menyimpan dan meneruskan kode error, tidak lagi merender halaman:

- `src/utils/error-page.ts` → `openBackendErrorPage(404)`, `fetchOrRedirect()`
- `URL` tak dikenal di router → redirect ke `<backend>/errors/404`
- `ErrorBoundary` (`fullPage`) → redirect ke `<backend>/errors/500`
- Request API yang gagal konek → redirect ke `<backend>/errors/503`

Base URL backend diambil dari `VITE_BACKEND_URL` (default `http://localhost:8000`),
halaman error dari `VITE_ERROR_PAGE_URL` (default: origin yang sama), lihat
`src/api/base-url.ts`. Di Docker keduanya dikosongkan karena nginx melayani
`/api` dan `/errors` pada origin yang sama.

## Deployment Docker

```bash
cp backend/.env.example .env   # isi APP_KEY & kredensial DB bila perlu
docker compose up -d --build
```

| File | Fungsi |
|---|---|
| `backend/Dockerfile` | PHP 8.4-FPM + nginx + supervisor, listen :8000 |
| `backend/docker/*.conf` | konfigurasi nginx internal, php.ini, supervisor |
| `frontend/Dockerfile` | build Vite lalu disajikan nginx (SPA fallback) |
| `frontend/nginx.conf` | SPA fallback + cache aset |
| `backend/public/errors/503.html` | halaman error statis untuk backend mati total |

## Test

```bash
cd backend
php artisan test --filter=ErrorPageTest
```
