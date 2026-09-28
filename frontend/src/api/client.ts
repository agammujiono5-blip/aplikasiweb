import { useEffect, useState, useCallback, useRef } from 'react';

export const API_BASE = 'http://localhost:8000/api';

// Cross-tab real-time sync channel
const realtimeChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('sipinjam_realtime_sync') : null;

// Client-side in-memory & session-backed SWR cache to achieve true 0-1ms UI response time
const clientQueryCache = new Map<string, unknown>();

export function getClientCache<T>(key: string): T | null {
  if (clientQueryCache.has(key)) {
    return clientQueryCache.get(key) as T;
  }
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const item = sessionStorage.getItem(`sqc_v3_${key}`);
      if (item) {
        const parsed = JSON.parse(item);
        clientQueryCache.set(key, parsed);
        return parsed as T;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export function setClientCache(key: string, val: unknown) {
  clientQueryCache.set(key, val);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem(`sqc_v3_${key}`, JSON.stringify(val));
    } catch {
      // ignore
    }
  }
}

export function clearClientCache() {
  clientQueryCache.clear();
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith('sqc_')) sessionStorage.removeItem(k);
      });
    } catch {
      // ignore
    }
  }
}

export function broadcastUpdate() {
  clearClientCache();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sipinjam:realtime-update'));
  }
  if (realtimeChannel) {
    try {
      realtimeChannel.postMessage({ type: 'UPDATE', timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
}

export function getAuthHeaders(isFormData = false, forRole?: 'admin' | 'user'): Record<string, string> {
  let token: string | null = null;
  if (forRole === 'admin') {
    token = localStorage.getItem('admin_auth_token') || localStorage.getItem('auth_token');
  } else if (forRole === 'user') {
    token = localStorage.getItem('user_auth_token') || localStorage.getItem('auth_token');
  } else {
    const activeRole = localStorage.getItem('user_role');
    if (activeRole === 'admin') {
      token = localStorage.getItem('admin_auth_token') || localStorage.getItem('auth_token');
    } else {
      token = localStorage.getItem('user_auth_token') || localStorage.getItem('auth_token');
    }
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface RoomItem {
  id: number;
  name: string;
  gedung: string;
  kapasitas: number;
  fasilitas: string[];
  status: 'tersedia' | 'terpakai' | 'maintenance';
  peminjaman_count: number;
  peminjamans_count?: number;
}

export interface PeminjamanItem {
  id: number;
  ticket_number: string;
  user_id: number;
  room_id: number;
  nama_kegiatan: string;
  organisasi: string;
  jenis_kegiatan: string | null;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  estimasi_peserta: number;
  keperluan: string | null;
  fasilitas: string[] | null;
  catatan: string | null;
  berkas_path?: string | null;
  berkas_url?: string | null;
  berkas_name?: string | null;
  status: 'menunggu' | 'disetujui' | 'ditolak';
  reject_note: string | null;
  created_at: string;
  room?: RoomItem;
  user?: {
    id: number;
    nim: string;
    name: string;
    email: string;
    phone: string | null;
    prodi?: string;
    organisasi?: string;
  };
}

export interface AdminStatsData {
  total: number;
  menunggu: number;
  disetujui: number;
  ditolak: number;
  pending_items: {
    id: string;
    db_id: number;
    title: string;
    room: string;
    date: string;
    raw_date: string;
    requester: string;
    org: string;
    days: number;
  }[];
  room_usage: {
    name: string;
    bookings: number;
    usage: number;
    status: string;
  }[];
}

export interface UserStatsData {
  total: number;
  disetujui: number;
  menunggu: number;
  ditolak: number;
  recent: PeminjamanItem[];
}

export interface UserAdminItem {
  id: string;
  nama: string;
  nim: string;
  email: string;
  prodi: string;
  fakultas: string;
  angkatan: string;
  phone?: string;
  organisasi?: string;
  jabatan?: string;
  alamat?: string;
  status: 'aktif' | 'nonaktif';
  pengajuan: number;
  disetujui: number;
}

export interface UserProfileData {
  id: number;
  nama: string;
  nim: string;
  email: string;
  phone: string;
  noHp: string;
  prodi: string;
  fakultas: string;
  angkatan: string;
  organisasi: string;
  jabatan?: string;
  alamat?: string;
  bio?: string;
  is_active: boolean;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  peminjaman_id: number | null;
  created_at: string;
}

export const api = {
  // Rooms
  rooms: {
    async getAll(): Promise<RoomItem[]> {
      const res = await fetch(`${API_BASE}/rooms`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Gagal memuat ruangan');
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    async create(data: { name: string; gedung: string; kapasitas: number; fasilitas?: string[]; status?: string }) {
      const res = await fetch(`${API_BASE}/admin/rooms`, {
        method: 'POST',
        headers: getAuthHeaders(false, 'admin'),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Gagal menambah ruangan');
      broadcastUpdate();
      return await res.json();
    },
    async update(id: number, data: { name: string; gedung: string; kapasitas: number; fasilitas?: string[]; status?: string }) {
      const res = await fetch(`${API_BASE}/admin/rooms/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(false, 'admin'),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Gagal memperbarui ruangan');
      broadcastUpdate();
      return await res.json();
    },
    async toggleStatus(id: number, status?: string) {
      const res = await fetch(`${API_BASE}/admin/rooms/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(false, 'admin'),
        body: JSON.stringify(status ? { status } : {}),
      });
      if (!res.ok) throw new Error('Gagal mengubah status ruangan');
      broadcastUpdate();
      return await res.json();
    },
    async delete(id: number) {
      const res = await fetch(`${API_BASE}/admin/rooms/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false, 'admin'),
      });
      if (!res.ok) throw new Error('Gagal menghapus ruangan');
      broadcastUpdate();
      return await res.json();
    },
  },

  // Peminjaman
  peminjaman: {
    async getUserHistory(): Promise<PeminjamanItem[]> {
      const res = await fetch(`${API_BASE}/user/peminjaman`, { headers: getAuthHeaders(false, 'user') });
      if (!res.ok) throw new Error('Gagal memuat riwayat pengajuan');
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    async getCampusApproved(): Promise<PeminjamanItem[]> {
      const res = await fetch(`${API_BASE}/jadwal`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Gagal memuat jadwal kampus');
      const json = await res.json();
      const list = Array.isArray(json.raw) ? json.raw : [];
      return list.filter((item: PeminjamanItem) => item.status === 'disetujui');
    },
    async submitUser(data: {
      nama_kegiatan: string;
      organisasi: string;
      jenis_kegiatan?: string;
      room_id: number;
      tanggal: string;
      jam_mulai: string;
      jam_selesai: string;
      estimasi_peserta: number;
      keperluan?: string;
      fasilitas?: string[];
      catatan?: string;
      berkas?: File | null;
    } | FormData) {
      let body: BodyInit;
      let headers: Record<string, string>;

      if (data instanceof FormData) {
        body = data;
        headers = getAuthHeaders(true, 'user');
      } else if (data.berkas) {
        const formData = new FormData();
        Object.entries(data).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            if (k === 'fasilitas' && Array.isArray(v)) {
              formData.append(k, JSON.stringify(v));
            } else if (k === 'berkas' && v instanceof File) {
              formData.append('berkas', v);
            } else {
              formData.append(k, String(v));
            }
          }
        });
        body = formData;
        headers = getAuthHeaders(true, 'user');
      } else {
        body = JSON.stringify(data);
        headers = getAuthHeaders(false, 'user');
      }

      const res = await fetch(`${API_BASE}/user/peminjaman`, {
        method: 'POST',
        headers,
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Gagal mengirim pengajuan');
      }
      broadcastUpdate();
      return await res.json();
    },
    async cancelUser(id: number) {
      const res = await fetch(`${API_BASE}/user/peminjaman/${id}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders(false, 'user'),
      });
      if (!res.ok) throw new Error('Gagal membatalkan pengajuan');
      broadcastUpdate();
      return await res.json();
    },
    async getUserStats(): Promise<UserStatsData> {
      const res = await fetch(`${API_BASE}/user/stats`, { headers: getAuthHeaders(false, 'user') });
      if (!res.ok) throw new Error('Gagal memuat statistik pengguna');
      const json = await res.json();
      return json.data;
    },
    async getAdminList(status?: string, search?: string): Promise<PeminjamanItem[]> {
      const params = new URLSearchParams();
      if (status && status !== 'semua') params.set('status', status);
      if (search) params.set('search', search);

      const res = await fetch(`${API_BASE}/admin/peminjaman?${params.toString()}`, { headers: getAuthHeaders(false, 'admin') });
      if (!res.ok) throw new Error('Gagal memuat pengajuan admin');
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    async updateStatusAdmin(id: number, status: 'disetujui' | 'ditolak', rejectNote?: string) {
      const res = await fetch(`${API_BASE}/admin/peminjaman/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(false, 'admin'),
        body: JSON.stringify({ status, reject_note: rejectNote }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status pengajuan');
      broadcastUpdate();
      return await res.json();
    },
    async getAdminStats(): Promise<AdminStatsData> {
      const res = await fetch(`${API_BASE}/admin/stats`, { headers: getAuthHeaders(false, 'admin') });
      if (!res.ok) throw new Error('Gagal memuat statistik admin');
      const json = await res.json();
      return json.data;
    },
  },

  // Jadwal
  jadwal: {
    async get(roomId?: string | number): Promise<Record<string, { id: string; db_id: number; title: string; room: string; time: string; requester: string; status: string; peserta?: number }[]>> {
      const params = new URLSearchParams();
      if (roomId && roomId !== 'all') params.set('room_id', String(roomId));

      const res = await fetch(`${API_BASE}/jadwal?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Gagal memuat jadwal');
      const json = await res.json();
      return json.data || {};
    },
  },

  // Users
  users: {
    async getAdminList(): Promise<UserAdminItem[]> {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders(false, 'admin') });
      if (!res.ok) throw new Error('Gagal memuat data pengguna');
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    async toggleStatus(id: number | string) {
      const res = await fetch(`${API_BASE}/admin/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: getAuthHeaders(false, 'admin'),
      });
      if (!res.ok) throw new Error('Gagal mengubah status pengguna');
      broadcastUpdate();
      return await res.json();
    },
    async getProfile(): Promise<UserProfileData> {
      const res = await fetch(`${API_BASE}/user/profile`, { headers: getAuthHeaders(false, 'user') });
      if (!res.ok) throw new Error('Gagal memuat profil');
      const json = await res.json();
      return json.data;
    },
    async updateProfile(data: Partial<UserProfileData> & { password_lama?: string; password_baru?: string }) {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(false, 'user'),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal memperbarui profil');
      }
      broadcastUpdate();
      return await res.json();
    },
  },

  // Notifications
  notifications: {
    async getAll(): Promise<NotificationItem[]> {
      const res = await fetch(`${API_BASE}/user/notifications`, { headers: getAuthHeaders(false, 'user') });
      if (!res.ok) throw new Error('Gagal memuat notifikasi');
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    async getUnreadCount(): Promise<number> {
      const res = await fetch(`${API_BASE}/user/notifications/unread-count`, { headers: getAuthHeaders(false, 'user') });
      if (!res.ok) return 0;
      const json = await res.json();
      return json.count ?? 0;
    },
    async markRead(id: number) {
      const res = await fetch(`${API_BASE}/user/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(false, 'user'),
      });
      if (!res.ok) throw new Error('Gagal menandai notifikasi');
      return await res.json();
    },
    async markAllRead() {
      const res = await fetch(`${API_BASE}/user/notifications/read-all`, {
        method: 'POST',
        headers: getAuthHeaders(false, 'user'),
      });
      if (!res.ok) throw new Error('Gagal menandai semua notifikasi');
      return await res.json();
    },
  },

  // Activity Logs (admin)
  activityLogs: {
    async getAll(search?: string, action?: string): Promise<{ id: number; action: string; description: string; admin_name: string; created_at: string; meta: Record<string, unknown> | null }[]> {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (action) params.set('action', action);
      const res = await fetch(`${API_BASE}/admin/activity-logs?${params.toString()}`, { headers: getAuthHeaders(false, 'admin') });
      if (!res.ok) throw new Error('Gagal memuat log aktivitas');
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
  },

  // Auth extras
  auth: {
    async forgotPassword(email: string): Promise<{
      status: string;
      message: string;
      debug?: {
        mailer?: string;
        mail_sent?: boolean;
        reset_url?: string;
        error?: string | null;
      };
    }> {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Gagal mengirim permintaan');
      }
      return json;
    },
    async resetPassword(email: string, token: string, password: string, password_confirmation: string): Promise<{ status: string; message: string }> {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, token, password, password_confirmation }),
      });
      const json = await res.json();
      return json;
    },
  },

  // Export
  export: {
    getPeminjamanCsvUrl(status?: string, bulan?: string): string {
      const token = localStorage.getItem('admin_auth_token') || localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (status && status !== 'semua') params.set('status', status);
      if (bulan) params.set('bulan', bulan);
      // We need token in header — use a fetch approach instead
      return `${API_BASE}/admin/peminjaman/export?${params.toString()}&token=${token}`;
    },
    async downloadPeminjaman(status?: string, bulan?: string) {
      const params = new URLSearchParams();
      if (status && status !== 'semua') params.set('status', status);
      if (bulan) params.set('bulan', bulan);
      const res = await fetch(`${API_BASE}/admin/peminjaman/export?${params.toString()}`, {
        headers: getAuthHeaders(false, 'admin'),
      });
      if (!res.ok) throw new Error('Gagal mengekspor data');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_peminjaman_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
    async importPeminjaman(file: File): Promise<{ status: string; message: string; imported_count: number; errors?: string[] }> {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/admin/peminjaman/import`, {
        method: 'POST',
        headers: getAuthHeaders(true, 'admin'),
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || 'Gagal mengimpor file CSV.');
      }
      broadcastUpdate();
      return json;
    },
    async downloadTemplateCsv() {
      const res = await fetch(`${API_BASE}/admin/peminjaman/template-csv`, {
        headers: getAuthHeaders(false, 'admin'),
      });
      if (!res.ok) throw new Error('Gagal mengunduh template CSV.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_import_peminjaman_2026.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  },
};

/**
 * Custom React Hook for Realtime Live Querying.
 * Polls at intervalMs (default 15000ms), listens to cross-tab & in-window broadcasts, and refreshes on tab focus.
 * Protected against request flooding via inFlightRef and tab visibility check.
 */
export function useLiveQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  intervalMs = 15000
): { data: T | null; loading: boolean; error: Error | null; refetch: () => Promise<void> } {
  // Generate a deterministic cache key based on queryFn signature and dependencies
  const cacheKey = useRef<string>('');
  try {
    cacheKey.current = queryFn.toString().slice(0, 120) + '_' + JSON.stringify(deps);
  } catch {
    cacheKey.current = String(queryFn).slice(0, 50) + '_' + deps.length;
  }

  // Retrieve instantly from in-memory / session cache if available (0-1ms delay)
  const initialCached = getClientCache<T>(cacheKey.current);

  const [data, setData] = useState<T | null>(initialCached);
  const [loading, setLoading] = useState<boolean>(initialCached === null);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const executeFetch = useCallback(async (isSilent = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!isSilent && !getClientCache(cacheKey.current)) {
      setLoading(true);
    }
    try {
      const res = await queryFn();
      setClientCache(cacheKey.current, res);
      if (isMountedRef.current) {
        setData(res);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      inFlightRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    isMountedRef.current = true;
    // If we already had cached data, do a silent background sync so there's no UI flash
    executeFetch(getClientCache(cacheKey.current) !== null);

    // Polling interval — skip if tab is in the background
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      executeFetch(true);
    }, intervalMs);

    // In-window event listener (instant event-driven update)
    const handleLocalUpdate = () => {
      executeFetch(true);
    };
    window.addEventListener('sipinjam:realtime-update', handleLocalUpdate);

    // Cross-tab broadcast listener (instant cross-tab sync)
    const handleBroadcast = () => {
      executeFetch(true);
    };
    if (realtimeChannel) {
      realtimeChannel.addEventListener('message', handleBroadcast);
    }

    // Window focus/visibility change listener (refresh instantly when tab becomes visible)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        executeFetch(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener('sipinjam:realtime-update', handleLocalUpdate);
      if (realtimeChannel) {
        realtimeChannel.removeEventListener('message', handleBroadcast);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [executeFetch, intervalMs]);

  return { data, loading, error, refetch: () => executeFetch(false) };
}
