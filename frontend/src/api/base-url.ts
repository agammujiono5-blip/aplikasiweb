/**
 * URL dasar API backend Laravel.
 *
 * Kosong = origin yang sama (same-origin). Nginx host meneruskan `/api`
 * ke container backend, sehingga production cukup memanggil `/api/...`.
 * Dapat dioverride saat build lewat VITE_BACKEND_URL (mis. bila ingin
 * memanggil https://api.webisdepinjam.cloud secara langsung).
 *
 * Development: `npm run dev` berjalan di :5173 sementara backend :8000,
 * jadi default-nya mengarah ke backend lokal (lihat .env.development).
 */
export const BACKEND_URL: string =
  ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '').replace(/\/$/, '');

/** URL lengkap API, selalu berakhiran `/api` (tanpa slash di belakang). */
export const API_BASE: string = `${BACKEND_URL}/api`;

/**
 * Halaman error disajikan di `/errors/{kode}` pada origin yang sama,
 * bukan oleh Laravel langsung. Dengan begitu tetap tersedia meskipun
 * backend mati.
 */
export const ERROR_PAGE_URL: string =
  ((import.meta.env.VITE_ERROR_PAGE_URL as string | undefined) ?? '').replace(/\/$/, '');
