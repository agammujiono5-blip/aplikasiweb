# ---------------------------------------------------------------------
# Backend Laravel — PHP 8.4 + FPM + nginx
#
# Image ini menyajikan:
#   - /api/*         → JSON API
#   - /errors/{kode} → halaman error Blade (resources/views/errors)
#   - /storage/*     → file publik (symlink public/storage)
#   - health check   → /up
#
# Halaman error sengaja dirender tanpa menyentuh database, sehingga tetap
# bisa tampil walau database sedang mati.
# ---------------------------------------------------------------------

# ---------------------------------------------------------------------
# Stage 1 — dependensi Composer (tanpa dev dependency)
# ---------------------------------------------------------------------
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

# Install dependensi tanpa script artisan (file aplikasi belum ada).
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction

COPY . .

# Optimized autoloader butuh app/ (source baru ada di tahap ini).
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative --no-scripts


# ---------------------------------------------------------------------
# Stage 2 — runtime PHP-FPM
# ---------------------------------------------------------------------
FROM php:8.4-fpm-alpine AS runtime

# Paket sistem & ekstensi PHP (PostgreSQL untuk Supabase, phpredis untuk
# cache/session Redis, intl/zip untuk upload & validasi).
RUN apk add --no-cache \
        nginx \
        supervisor \
        curl \
        libpng-dev \
        oniguruma-dev \
        libxml2-dev \
        postgresql-dev \
        libzip-dev \
        icu-dev \
    && docker-php-ext-install \
        pdo_pgsql \
        pdo_mysql \
        bcmath \
        pcntl \
        intl \
        zip \
        opcache \
    # Ekstensi phpredis (REDIS_CLIENT=phpredis) + redis-cli untuk healthcheck.
    && apk add --no-cache --virtual .redis-build $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk add --no-cache redis \
    && apk del .redis-build

WORKDIR /var/www/html

COPY --from=vendor /app /var/www/html
COPY docker/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/nginx-backend.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

# Storage & bootstrap cache harus bisa ditulis proses PHP.
# .env tidak pernah disertakan ke image.
RUN mkdir -p \
        storage/framework/{cache/data,sessions,views} \
        storage/logs \
        storage/app/public \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && rm -f .env .env.* \
    && chmod -R ug+rwX storage bootstrap/cache

# Entrypoint: symlink storage, permission, cache config dibangun ulang dari
# environment runtime (nilai rahasia tidak pernah masuk image), migrasi
# opsional via AUTO_MIGRATE.
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=45s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/up || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
