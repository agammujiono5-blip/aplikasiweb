#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Entrypoint backend Laravel (container produksi)
#
# Tugas:
#  1. Menunggu Redis siap (cache/session).
#  2. Membuat symlink storage publik (foto profil & berkas peminjaman).
#  3. Memastikan permission storage & bootstrap/cache.
#  4. Membangun ulang cache konfigurasi dengan environment produksi.
#  5. Menjalankan migrasi database bila AUTO_MIGRATE=true.
#  6. Menjalankan supervisord (php-fpm + nginx).
#
# Semua langkah bisa dilewati agar container tetap bisa start saat DB mati:
# halaman error Blade tetap tampil.
# ---------------------------------------------------------------------------

cd /var/www/html

is_true() {
    case "$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')" in
        1|true|yes|on) return 0 ;;
        *) return 1 ;;
    esac
}

log() {
    printf '[entrypoint] %s\n' "$*"
}

# 1. Tunggu Redis (opsional, non-fatal).
if [ -n "${REDIS_HOST:-}" ] && [ "$REDIS_HOST" != "127.0.0.1" ]; then
    attempts=0
    while [ "$attempts" -lt 20 ]; do
        if php -r '$s=@fsockopen(getenv("REDIS_HOST"), (int)(getenv("REDIS_PORT") ?: 6379), $e, $m, 2); exit($s ? 0 : 1);'; then
            log "Redis siap di ${REDIS_HOST}:${REDIS_PORT:-6379}"
            break
        fi
        attempts=$((attempts + 1))
        sleep 1
    done
    if [ "$attempts" -ge 20 ]; then
        log "PERINGATAN: Redis belum dapat dihubungi, lanjut start."
    fi
fi

# 2. Storage publik.
if [ ! -L public/storage ]; then
    php artisan storage:link --no-interaction || log "PERINGATAN: storage:link gagal"
fi

# 3. Permission & struktur storage.
#    Volume bernama bisa menutupi isi image dengan direktori kosong, jadi
#    sub-folder framework wajib dipastikan ada (bukan hanya saat build).
mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    storage/app/public \
    bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R ug+rwX storage bootstrap/cache 2>/dev/null || true

# 4. Rebuild cache config/route/event agar ENV container benar-benar dipakai.
#    config:cache dievaluasi dengan .env kosong; hasilnya bisa membekukan
#    nilai sementara, jadi selalu dibangun ulang dari environment runtime.
if is_true "${APP_OPTIMIZE:-true}"; then
    log "Membangun ulang cache konfigurasi, route, dan event..."
    php artisan config:cache --no-interaction || log "PERINGATAN: config:cache gagal"
    php artisan route:cache --no-interaction || log "PERINGATAN: route:cache gagal"
    php artisan event:cache --no-interaction || log "PERINGATAN: event:cache gagal"
fi

# 5. Migrasi (default mati; aktifkan lewat AUTO_MIGRATE=true).
if is_true "${AUTO_MIGRATE:-false}"; then
    log "Menjalankan migrasi database..."
    php artisan migrate --force --no-interaction
fi

# 6. Jalankan supervisord.
exec "$@"
