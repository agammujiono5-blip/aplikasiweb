import { api, useLiveQuery } from '../../api/client';
import { showToast } from '../../utils/toast';
import { CheckCircle2, Clock } from 'lucide-react';

interface AdminBerandaProps {
  onNavigate: (page: string) => void;
}

export default function AdminBeranda({ onNavigate }: AdminBerandaProps) {
  const { data: stats, refetch } = useLiveQuery(() => api.peminjaman.getAdminStats());

  // Logged-in admin user info
  const storedUser = localStorage.getItem('admin_user_data') || localStorage.getItem('user_data');
  const adminName = storedUser ? (JSON.parse(storedUser).name || JSON.parse(storedUser).nama || 'Bpk. Hendra') : 'Bpk. Hendra';

  const handleQuickApprove = async (dbId: number) => {
    try {
      await api.peminjaman.updateStatusAdmin(dbId, 'disetujui');
      refetch();
      showToast('Pengajuan berhasil disetujui', 'success');
    } catch (err) {
      showToast('Gagal menyetujui: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
  };

  const handleQuickReject = async (dbId: number) => {
    const note = prompt('Masukkan alasan penolakan:');
    if (note === null) return;
    try {
      await api.peminjaman.updateStatusAdmin(dbId, 'ditolak', note);
      refetch();
      showToast('Pengajuan berhasil ditolak', 'success');
    } catch (err) {
      showToast('Gagal menolak: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
  };

  const pendingItems = Array.isArray(stats?.pending_items) ? stats.pending_items : [];
  const roomUsage = Array.isArray(stats?.room_usage) ? stats.room_usage : [];

  const statCards = [
    {
      label: 'Total Pengajuan Masuk',
      value: String(stats?.total ?? 0),
      sub: 'Semua waktu',
      color: '#4b3f9e',
      delta: 'Live data sinkron',
    },
    {
      label: 'Menunggu Verifikasi',
      value: String(stats?.menunggu ?? 0),
      sub: 'Perlu diproses segera',
      color: '#b45309',
      delta: `${pendingItems.filter(p => p.days >= 2).length} sudah > 2 hari`,
    },
    {
      label: 'Disetujui',
      value: String(stats?.disetujui ?? 0),
      sub: stats?.total ? `${Math.round((stats.disetujui / stats.total) * 100)}% dari total` : '0%',
      color: '#065f46',
      delta: 'Telah disetujui',
    },
    {
      label: 'Ditolak',
      value: String(stats?.ditolak ?? 0),
      sub: stats?.total ? `${Math.round((stats.ditolak / stats.total) * 100)}% tingkat penolakan` : '0%',
      color: '#991b1b',
      delta: 'Ditolak/Dibatalkan',
    },
  ];

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[#787583] text-[13px]">Selamat datang kembali,</p>
          <h1 className="text-[#111c2d] text-[26px] font-bold tracking-[-0.5px]">{adminName}</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[#474552] text-[13px]">Petugas Sarpras · Real-time Live Sync Aktif</p>
          </div>
        </div>
        <div className="shrink-0 flex gap-2">
          <button
            onClick={() => onNavigate('pengajuan')}
            className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1"/>
            </svg>
            Kelola Pengajuan
          </button>
        </div>
      </div>

      {/* Alert: pengajuan menunggu */}
      {pendingItems.some(p => p.days >= 2) && (
        <div className="flex items-start gap-3 bg-[#fef3c7] border border-[#fde68a] rounded-[10px] px-5 py-4 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#92400e] text-[13px] font-semibold">Ada pengajuan yang menunggu lebih dari 2 hari</span>
            <span className="text-[#92400e] text-[12px]">
              {pendingItems.filter(p => p.days >= 2).length} pengajuan sudah menunggu verifikasi lebih lama dari batas waktu standar.
            </span>
          </div>
          <button onClick={() => onNavigate('pengajuan')} className="shrink-0 text-[#b45309] text-[12px] font-semibold hover:underline ml-auto">Tinjau →</button>
        </div>
      )}

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
              <span className="text-[11px] font-semibold" style={{ color: s.color }}>{s.delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending list */}
        <div className="lg:col-span-7 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <div className="flex items-center gap-2">
              <h3 className="text-[#111c2d] text-[15px] font-semibold">Pengajuan Menunggu Verifikasi</h3>
              <span className="bg-[#fef3c7] text-[#92400e] text-[11px] font-bold px-2 py-0.5 rounded-full">
                {pendingItems.length}
              </span>
            </div>
            <button onClick={() => onNavigate('pengajuan')} className="text-[#4b3f9e] text-[12px] font-semibold hover:underline">Lihat semua</button>
          </div>
          <div className="flex flex-col divide-y divide-[rgba(201,196,212,0.3)]">
            {pendingItems.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-[#ecfdf5] rounded-full flex items-center justify-center mb-4 relative">
                  <div className="absolute inset-0 bg-emerald-500 opacity-10 rounded-full animate-ping" />
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 relative z-10" />
                </div>
                <h4 className="text-[#111c2d] text-[15px] font-bold mb-1">Tidak ada antrean!</h4>
                <p className="text-[#787583] text-[13px] max-w-[250px]">Semua pengajuan sudah diverifikasi. Nikmati waktu istirahat Anda.</p>
              </div>
            ) : (
              pendingItems.map(item => (
                <div key={item.id} className="px-5 py-4 flex items-start gap-3 hover:bg-[#fafafc] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[#111c2d] text-[13px] font-semibold leading-snug">{item.title}</span>
                      {item.days >= 2 && (
                        <span className="shrink-0 text-[10px] font-semibold bg-[#fee2e2] text-[#991b1b] px-2 py-0.5 rounded-full border border-[#fecdd3]">
                          {item.days}h menunggu
                        </span>
                      )}
                    </div>
                    <span className="text-[#787583] text-[11px]">{item.id} · {item.requester} · {item.org}</span>
                    <span className="text-[#787583] text-[11px]">{item.room} · {item.date}</span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleQuickApprove(item.db_id)}
                      className="w-7 h-7 rounded-[6px] bg-[#d1fae5] flex items-center justify-center hover:bg-[#a7f3d0] transition-colors cursor-pointer"
                      title="Setujui Pengajuan"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button
                      onClick={() => handleQuickReject(item.db_id)}
                      className="w-7 h-7 rounded-[6px] bg-[#fee2e2] flex items-center justify-center hover:bg-[#fecdd3] transition-colors cursor-pointer"
                      title="Tolak Pengajuan"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Room usage */}
        <div className="lg:col-span-5 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">Penggunaan Ruangan</h3>
            <span className="text-[#787583] text-[11px]">Real-time Live</span>
          </div>
          <div className="flex flex-col px-5 py-4 gap-4">
            {roomUsage.map(r => (
              <div key={r.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#111c2d] text-[12px] font-semibold">{r.name}</span>
                  <span className="text-[#787583] text-[11px]">{r.bookings} peminjaman</span>
                </div>
                <div className="h-2 bg-[#f0f1f5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${r.usage}%`,
                      backgroundColor: r.usage > 75 ? '#4b3f9e' : r.usage > 50 ? '#6c5ce7' : '#a29bfe',
                    }}
                  />
                </div>
                <span className="text-[#787583] text-[10px]">{r.usage}% utilisasi kegiatan</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
