import { useState, useEffect } from 'react';
import { Plus, Sparkles, Building2 } from 'lucide-react';
import { api, useLiveQuery } from '../../api/client';
import type { RoomItem } from '../../api/client';

interface BerandaProps {
  onNavigate: (page: string) => void;
}

const DEFAULT_ROOMS: RoomItem[] = [
  { id: 1, name: 'Auditorium Rektorat Lt. 3', gedung: 'Gedung Rektorat', kapasitas: 500, fasilitas: ['Proyektor', 'Sound System', 'AC', 'Lighting', 'Podium'], status: 'terpakai', peminjaman_count: 13 },
  { id: 2, name: 'Aula Gedung A', gedung: 'Gedung A', kapasitas: 300, fasilitas: ['Proyektor', 'Sound System', 'AC', 'Podium'], status: 'tersedia', peminjaman_count: 11 },
  { id: 3, name: 'Lab Komputer B-101', gedung: 'Gedung B', kapasitas: 40, fasilitas: ['PC Workstation', 'AC', 'Proyektor'], status: 'tersedia', peminjaman_count: 5 },
  { id: 4, name: 'Ruang Seminar C-205', gedung: 'Gedung C', kapasitas: 80, fasilitas: ['Proyektor', 'Whiteboard', 'AC'], status: 'tersedia', peminjaman_count: 7 },
  { id: 5, name: 'Lab Multimedia Fasilkom', gedung: 'Gedung Fasilkom', kapasitas: 40, fasilitas: ['PC Workstation', 'AC'], status: 'terpakai', peminjaman_count: 10 },
  { id: 6, name: 'Ruang Rapat Dekanat', gedung: 'Gedung Rektorat', kapasitas: 20, fasilitas: ['TV LED', 'AC', 'Whiteboard'], status: 'maintenance', peminjaman_count: 3 },
];

const statusStyle: Record<string, { bg: string; border: string; text: string; label: string }> = {
  menunggu: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', label: 'Menunggu Verifikasi' },
  disetujui: { bg: '#d1fae5', border: '#a7f3d0', text: '#065f46', label: 'Disetujui' },
  ditolak: { bg: '#fee2e2', border: '#fecdd3', text: '#991b1b', label: 'Ditolak' },
};

export default function Beranda({ onNavigate }: BerandaProps) {
  // Live query for user stats, available rooms, and student profile
  const { data: combinedData } = useLiveQuery(async () => {
    const [stats, rooms, profile] = await Promise.all([
      api.peminjaman.getUserStats(),
      api.rooms.getAll(),
      api.users.getProfile().catch(() => null),
    ]);
    return { stats, rooms, profile };
  });

  const stats = combinedData?.stats;
  const rooms = (combinedData?.rooms && combinedData.rooms.length > 0) ? combinedData.rooms : DEFAULT_ROOMS;
  const liveProfile = combinedData?.profile;

  // Logged-in user information with reactive live sync
  const [currentUser, setCurrentUser] = useState<{ name?: string; nama?: string; nim?: string; email?: string } | null>(() => {
    try {
      const stored = localStorage.getItem('user_data');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed?.petugas_id || parsed?.name?.toLowerCase().includes('petugas') || parsed?.email === 'admin@kampus.ac.id') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const sync = () => {
      try {
        const stored = localStorage.getItem('user_data');
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (parsed?.petugas_id || parsed?.name?.toLowerCase().includes('petugas') || parsed?.email === 'admin@kampus.ac.id') {
          return;
        }
        setCurrentUser(parsed);
      } catch {
        // ignore
      }
    };
    window.addEventListener('sipinjam:realtime-update', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('sipinjam:realtime-update', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const activeUser: {
    name?: string;
    nama?: string;
    nim?: string;
    email?: string;
  } | null = liveProfile || currentUser;
  const userName = activeUser?.nama || activeUser?.name || 'Mahasiswa';
  const userNim = activeUser?.nim || (activeUser?.email ? '-' : '-');

  const statCards = [
    { label: 'Total Pengajuan', value: String(stats?.total ?? 0), sub: 'Sepanjang waktu', color: '#4b3f9e', bg: '#ece9fe' },
    { label: 'Disetujui', value: String(stats?.disetujui ?? 0), sub: stats?.total ? `${Math.round((stats.disetujui / stats.total) * 100)}% dari total pengajuan` : '0%', color: '#065f46', bg: '#d1fae5' },
    { label: 'Menunggu Verifikasi', value: String(stats?.menunggu ?? 0), sub: 'Sedang diproses admin', color: '#92400e', bg: '#fef3c7' },
    { label: 'Ditolak', value: String(stats?.ditolak ?? 0), sub: 'Perlu ajukan ulang', color: '#991b1b', bg: '#fee2e2' },
  ];

  const recentActivity = Array.isArray(stats?.recent) ? stats.recent : [];

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Welcome banner */}
      <div
        className="rounded-[16px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #342586 0%, #4b3f9e 60%, #6c5ce7 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-32 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col gap-1">
          <p className="text-white/70 text-[13px] font-normal">Selamat datang kembali,</p>
          <h2 className="text-white text-[22px] font-bold tracking-[-0.4px]">{userName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Realtime Aktif" />
            <p className="text-white/80 text-[13px]">NIM: {userNim}</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('ajukan')}
          className="relative z-10 shrink-0 flex items-center gap-2 bg-white text-[#4b3f9e] text-[14px] font-semibold px-5 py-[10px] rounded-[10px] hover:bg-white/90 transition-colors shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajukan Peminjaman
        </button>
      </div>

      {/* Stats with Glassmorphism & Hover Micro-animations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div 
            key={s.label} 
            className="bg-white/60 backdrop-blur-md border border-[rgba(201,196,212,0.5)] rounded-[16px] p-5 flex flex-col gap-1.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white cursor-default group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#787583] text-[12px] group-hover:text-[#474552] transition-colors">{s.label}</span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: `${s.color}15` }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
            </div>
            <span className="text-[32px] font-extrabold tracking-tight" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[#787583] text-[11px] mt-0.5 truncate">{s.sub}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[11px] font-semibold" style={{ color: s.color }}>Pembaruan Live</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-7 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">Aktivitas Pengajuan Saya</h3>
            <button onClick={() => onNavigate('riwayat')} className="text-[#4b3f9e] text-[12px] font-semibold hover:underline cursor-pointer">Lihat semua</button>
          </div>
          <div className="flex flex-col divide-y divide-[rgba(201,196,212,0.3)]">
            {recentActivity.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-[#f0effe] rounded-full flex items-center justify-center mb-4 relative text-[#4b3f9e]">
                  <div className="absolute inset-0 bg-[#4b3f9e] opacity-10 rounded-full animate-ping" />
                  <Sparkles className="w-9 h-9 relative z-10" />
                </div>
                <h4 className="text-[#111c2d] text-[15px] font-bold mb-1">Mulai Peminjaman Baru!</h4>
                <p className="text-[#787583] text-[13px] max-w-[250px] mb-4">
                  Belum ada riwayat pengajuan. Yuk mulai ajukan peminjaman pertamamu sekarang.
                </p>
                <button 
                  onClick={() => onNavigate('ajukan')}
                  className="bg-[#4b3f9e] hover:bg-[#342586] text-white px-5 py-2 rounded-[8px] text-[13px] font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Ajukan Peminjaman
                </button>
              </div>
            ) : (
              recentActivity.map(item => {
                const s = statusStyle[item.status] || { bg: '#f0f1f5', border: '#ddd', text: '#787583', label: item.status };
                return (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-4 hover:bg-[#fafafc] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#ece9fe] flex items-center justify-center shrink-0 mt-0.5 text-[#4b3f9e]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[#111c2d] text-[13px] font-semibold leading-snug line-clamp-1">{item.nama_kegiatan}</span>
                        <span
                          className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <span className="text-[#787583] text-[11px]">{item.room?.name || '-'} · {item.tanggal} ({item.jam_mulai}–{item.jam_selesai} WIB)</span>
                      <span className="text-[#4b3f9e] text-[11px] font-mono font-medium">{item.ticket_number}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Available Rooms */}
        <div className="lg:col-span-5 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">Status Ketersediaan Ruangan</h3>
            <span className="text-[#065f46] text-[11px] font-semibold bg-[#d1fae5] px-2 py-0.5 rounded-full">
              {rooms.filter(r => r.status === 'tersedia').length} Tersedia
            </span>
          </div>
          <div className="flex flex-col divide-y divide-[rgba(201,196,212,0.3)]">
            {rooms.slice(0, 5).map(room => (
              <div key={room.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[#fafafc] transition-colors">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[#111c2d] text-[13px] font-semibold truncate">{room.name}</span>
                  <span className="text-[#787583] text-[11px]">
                    Kapasitas: {room.kapasitas} orang · {room.fasilitas ? room.fasilitas.slice(0, 2).join(', ') : '-'}
                  </span>
                </div>
                <span
                  className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{
                    backgroundColor: room.status === 'tersedia' ? '#d1fae5' : room.status === 'terpakai' ? '#fef3c7' : '#fee2e2',
                    color: room.status === 'tersedia' ? '#065f46' : room.status === 'terpakai' ? '#92400e' : '#991b1b',
                  }}
                >
                  {room.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
