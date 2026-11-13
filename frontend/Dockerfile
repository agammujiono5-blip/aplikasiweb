# ---------------------------------------------------------------------------
# Frontend — build Vite lalu disajikan nginx
#
# Base URL backend diambil saat build (VITE_BACKEND_URL). Default kosong =
# same-origin: Nginx host meneruskan /api ke container backend, sehingga
# bundle tidak berisi localhost dan tidak butuh CORS.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Kosong = pakai origin yang sama (nginx meneruskan /api ke backend).
ARG VITE_BACKEND_URL=""
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Kosong = halaman error diambil dari origin yang sama (/errors/...).
ARG VITE_ERROR_PAGE_URL=""
ENV VITE_ERROR_PAGE_URL=$VITE_ERROR_PAGE_URL

# "1" akan menghentikan build bila bundle masih memuat localhost/127.0.0.1.
ARG FAIL_ON_LOCALHOST="1"
ENV FAIL_ON_LOCALHOST=$FAIL_ON_LOCALHOST

RUN npm run build \
    && if [ "$FAIL_ON_LOCALHOST" = "1" ] \
       && grep -rIl -e "localhost:8000" -e "127.0.0.1:8000" -e "localhost:5173" dist; then \
         echo "ERROR: bundle production masih memuat URL localhost." >&2; \
         exit 1; \
       fi


# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Konfigurasi utama: server_tokens off + gzip.
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 --start-period=10s \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

# nginx:alpine default sudah menjalankan master process sebagai root untuk
# bind :80, lalu mengatur worker ke user `nginx` (proses request tanpa
# privilege). Root filesystem tetap read-only untuk direktori aplikasi.
