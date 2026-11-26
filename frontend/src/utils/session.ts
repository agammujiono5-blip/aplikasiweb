/**
 * Manajemen sesi klien: 10 menit tanpa aktivitas → pengguna harus login ulang.
 *
 * Sesi backend bersifat sliding (`expires_at` diperpanjang setiap request),
 * jadi supaya sesi benar-benar "10 menit idle" dan bukan "10 menit sejak
 * request terakhir", klien memantau aktivitas pengguna (klik, ketik, scroll,
 * sentuh, perpindahan tab). Satu timer bersama di seluruh aplikasi hanya
 * berdetak setiap 0,5 detik sehingga biaya CPU tetap sangat kecil.
 */

/** Lama sesi tanpa aktivitas (detik). Harus sama dengan SESSION_MINUTES backend. */
export const SESSION_TIMEOUT_SECONDS = 10 * 60;

/** Interval pemeriksaan timer (ms) → 0,5 detik. */
export const SESSION_TICK_MS = 500;

/** Kunci localStorage kapan terakhir pengguna aktif (ms epoch). */
const LAST_ACTIVITY_KEY = 'session_last_activity_at';

/** Event DOM yang dianggap sebagai aktivitas pengguna. */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
];

let lastActivity = Date.now();
let lastWrite = 0;
let installed = false;

function getRoleScopedKey(): string {
  const role = localStorage.getItem('user_role');
  return role ? `${LAST_ACTIVITY_KEY}_${role}` : LAST_ACTIVITY_KEY;
}

/** Ambil waktu aktivitas terakhir dari storage. Berlaku lintas tab. */
export function getLastActivity(): number {
  try {
    const stored = Number(localStorage.getItem(getRoleScopedKey()));
    if (stored > 0) return stored;
  } catch {
    // ignore
  }
  // Belum ada jejak (mis. baru login/refresh): anggap aktif saat ini.
  return lastActivity;
}

/**
 * Catat aktivitas pengguna. Penulisan localStorage dibatasi ~1x/detik agar
 * handler pointermove tidak membebani main thread.
 */
export function markActivity(force = false): void {
  const now = Date.now();
  lastActivity = now;
  if (force || now - lastWrite > 1000) {
    lastWrite = now;
    try {
      localStorage.setItem(getRoleScopedKey(), String(now));
    } catch {
      // ignore
    }
  }
}

/** Hapus jejak aktivitas (dipanggil saat login/logout). */
export function clearActivity(): void {
  try {
    sessionStorage.removeItem('session_watchdog_init');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(`${LAST_ACTIVITY_KEY}_penyewa`);
    localStorage.removeItem(`${LAST_ACTIVITY_KEY}_admin`);
  } catch {
    // ignore
  }
}

/**
 * Pasang listener aktivitas global satu kali. Mengembalikan fungsi untuk
 * melepasnya kembali.
 */
export function installActivityListeners(onResume?: () => void): () => void {
  if (installed || typeof window === 'undefined') return () => undefined;
  installed = true;

  const handler = () => markActivity();
  ACTIVITY_EVENTS.forEach((evt) => {
    window.addEventListener(evt, handler, { passive: true });
  });
  document.addEventListener('visibilitychange', handler);

  if (onResume) {
    window.addEventListener('focus', onResume);
  }

  return () => {
    installed = false;
    ACTIVITY_EVENTS.forEach((evt) => {
      window.removeEventListener(evt, handler);
    });
    document.removeEventListener('visibilitychange', handler);
    if (onResume) window.removeEventListener('focus', onResume);
  };
}
