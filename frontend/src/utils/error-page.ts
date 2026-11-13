/**
 * Navigasi ke halaman error yang dirender Laravel.
 * View: backend/resources/views/errors/{kode}.blade.php
 */

import { ERROR_PAGE_URL } from '../api/base-url';

/** Status yang punya halaman khusus di backend (lihat backend/config/http_status.php). */
const BACKEND_ERROR_CODES = [400, 401, 402, 403, 404, 405, 408, 409, 413, 419, 422, 429, 500, 501, 502, 503, 504];

export function openBackendErrorPage(code: number): void {
  const safeCode = BACKEND_ERROR_CODES.includes(code) ? code : 500;
  window.location.assign(`${ERROR_PAGE_URL}/errors/${safeCode}`);
}

/**
 * Handler fetch yang mengarahkan ke halaman error backend bila server mati
 * atau membalas status error. Dipakai untuk request non-API-critical.
 */
export async function fetchOrRedirect(input: string, init?: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch {
    // Backend tidak bisa dihubungi (server down / jaringan putus).
    openBackendErrorPage(503);
    throw new Error('Backend tidak dapat dihubungi');
  }

  if (!response.ok && BACKEND_ERROR_CODES.includes(response.status)) {
    openBackendErrorPage(response.status);
  }

  return response;
}
