import { useState } from 'react';
import { api } from '../../api/client';
import type { PeminjamanItem } from '../../api/client';
import { useLiveQuery } from '../../api/client';

const statusStyle: Record<string, { bg: string; border: string; text: string; label: string; icon: string }> = {
  menunggu:  { bg: '#fef3c7', border: '#fde68a', text: '#92400e', label: 'Menunggu Verifikasi', icon: '⏳' },
  disetujui: { bg: '#d1fae5', border: '#a7f3d0', text: '#065f46', label: 'Disetujui', icon: '✅' },
  ditolak:   { bg: '#fee2e2', border: '#fecdd3', text: '#991b1b', label: 'Ditolak', icon: '❌' },
};

const MONTHS = [
  { value: '', label: 'Semua Bulan' },
  ...Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, i, 1);
    return { value: `2026-${String(i + 1).padStart(2, '0')}`, label: d.toLocaleString('id-ID', { month: 'long', year: 'numeric' }) };
  }),
];

interface RiwayatPageProps {
  onNavigate?: (page: string) => void;
}

export default function RiwayatPage({ onNavigate }: RiwayatPageProps) {
  const [activeTab, setActiveTab] = useState<'saya' | 'kampus'>('saya');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [search, setSearch] = useState('');
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<PeminjamanItem | null>(null);

  // Get active logged-in user name
  let userName = 'Anda';
  try {
    const rawUser = localStorage.getItem('user_data');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      userName = u.nama || u.name || 'Anda';
    }
  } catch {
    // fallback
  }

  // 1. Live Query: User's personal application history
  const { data: rawUserItems, refetch: refetchUser } = useLiveQuery<PeminjamanItem[]>(
    () => api.peminjaman.getUserHistory(),
    [],
    10000
  );
  const userItems = Array.isArray(rawUserItems) ? rawUserItems : [];

  // 2. Live Query: Campus-wide approved bookings (synced with Jadwal Ruangan)
  const { data: rawCampusItems } = useLiveQuery<PeminjamanItem[]>(
    () => api.peminjaman.getCampusApproved(),
    [],
    10000
  );
  const campusItems = Array.isArray(rawCampusItems) ? rawCampusItems : [];

  // Filter for Personal History
  const filteredUser = userItems.filter(item => {
    const matchStatus = filterStatus === 'semua' || item.status === filterStatus;
    const matchBulan = !filterBulan || item.tanggal.startsWith(filterBulan);
    const q = search.toLowerCase();
    const matchSearch = !q || item.nama_kegiatan.toLowerCase().includes(q)
      || item.ticket_number.toLowerCase().includes(q)
      || (item.room?.name || '').toLowerCase().includes(q);
    return matchStatus && matchBulan && matchSearch;
  });

  // Filter for Campus-wide Approved
  const filteredCampus = campusItems.filter(item => {
    const matchBulan = !filterBulan || item.tanggal.startsWith(filterBulan);
    const q = search.toLowerCase();
    const matchSearch = !q || item.nama_kegiatan.toLowerCase().includes(q)
      || item.ticket_number.toLowerCase().includes(q)
      || (item.room?.name || '').toLowerCase().includes(q)
      || (item.organisasi || '').toLowerCase().includes(q)
      || (item.user?.name || '').toLowerCase().includes(q);
    return matchBulan && matchSearch;
  });

  const handleCancel = async (id: number) => {
    if (!window.confirm('Yakin ingin membatalkan pengajuan ini?')) return;
    setCancelingId(id);
    try {
      await api.peminjaman.cancelUser(id);
      await refetchUser();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCancelingId(null);
    }
  };

  const isSayaTab = activeTab === 'saya';
  const currentList = isSayaTab ? filteredUser : filteredCampus;
  const currentTotal = isSayaTab ? userItems.length : campusItems.length;

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#111c2d] text-[22px] font-bold tracking-[-0.4px]">Riwayat Peminjaman</h1>
          <p className="text-[#787583] text-[13px] mt-1">
            Pantau status pengajuan ruangan pribadi atau seluruh peminjaman yang telah disetujui di kampus.
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('ajukan')}
            className="shrink-0 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            + Ajukan Peminjaman
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(201,196,212,0.4)] gap-6">
        <button
          onClick={() => { setActiveTab('saya'); setSearch(''); setFilterStatus('semua'); setFilterBulan(''); }}
          className={`pb-3 text-[14px] font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
            isSayaTab
              ? 'text-[#4b3f9e] border-b-2 border-[#4b3f9e]'
              : 'text-[#787583] hover:text-[#111c2d]'
          }`}
        >
          <span>Pengajuan Saya</span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors"
            style={{
              backgroundColor: isSayaTab ? '#ece9fe' : '#f0f1f5',
              color: isSayaTab ? '#4b3f9e' : '#787583'
            }}
          >
            {userItems.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('kampus'); setSearch(''); setFilterStatus('semua'); setFilterBulan(''); }}
          className={`pb-3 text-[14px] font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
            !isSayaTab
              ? 'text-[#4b3f9e] border-b-2 border-[#4b3f9e]'
              : 'text-[#787583] hover:text-[#111c2d]'
          }`}
        >
          <span>Agenda Kampus Disetujui</span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors"
            style={{
              backgroundColor: !isSayaTab ? '#d1fae5' : '#f0f1f5',
              color: !isSayaTab ? '#065f46' : '#787583'
            }}
          >
            {campusItems.length}
          </span>
        </button>
      </div>

      {/* Scope Info Card */}
      {isSayaTab ? (
        <div className="bg-[#f8f7ff] border border-[#e0ddfc] rounded-[10px] px-4 py-3 flex items-start gap-3 text-[12px] text-[#4b3f9e]">
          <span className="text-base shrink-0 mt-0.5">💡</span>
          <div>
            <strong>Catatan Pengajuan Pribadi:</strong> Tab ini menampilkan pengajuan yang diajukan oleh akun Anda (<strong>{userName}</strong>). Untuk melihat seluruh kegiatan ruangan kampus yang sedang/akan berlangsung, buka tab <strong>Agenda Kampus Disetujui</strong> atau menu <strong>Jadwal Ruangan</strong>.
          </div>
        </div>
      ) : (
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] px-4 py-3 flex items-start gap-3 text-[12px] text-[#166534]">
          <span className="text-base shrink-0 mt-0.5">📅</span>
          <div>
            <strong>Agenda Publik Kampus:</strong> Menampilkan seluruh peminjaman ruangan yang telah disetujui di lingkungan kampus (sinkron persis dengan kegiatan pada menu <strong>Jadwal Ruangan</strong>).
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder={isSayaTab ? "Cari nama kegiatan, tiket, ruangan..." : "Cari kegiatan, tiket, ruangan, pemohon..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-[38px] flex-1 min-w-[200px] px-4 rounded-[10px] border border-[rgba(201,196,212,0.6)] text-[13px] outline-none focus:border-[#4b3f9e] bg-white text-[#111c2d] placeholder-[#787583]"
        />
        {isSayaTab && (
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-[38px] px-3 rounded-[10px] border border-[rgba(201,196,212,0.6)] text-[13px] outline-none focus:border-[#4b3f9e] bg-white text-[#111c2d]"
          >
            <option value="semua">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
        )}
        <select
          value={filterBulan}
          onChange={e => setFilterBulan(e.target.value)}
          className="h-[38px] px-3 rounded-[10px] border border-[rgba(201,196,212,0.6)] text-[13px] outline-none focus:border-[#4b3f9e] bg-white text-[#111c2d]"
        >
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* Count */}
      <div className="text-[#787583] text-[12px]">
        Menampilkan <strong className="text-[#111c2d]">{currentList.length}</strong> dari {currentTotal} {isSayaTab ? 'pengajuan Anda' : 'peminjaman kampus disetujui'}
      </div>

      {/* Table / Cards */}
      {isSayaTab && userItems.length === 0 ? (
        /* Empty state specifically when user has never made any application */
        <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-8 sm:p-12 text-center flex flex-col items-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-[#ece9fe] rounded-full flex items-center justify-center mb-4 text-[#4b3f9e] text-3xl">
            📋
          </div>
          <h3 className="text-[#111c2d] text-[17px] font-bold">Belum Ada Pengajuan Pribadi</h3>
          <p className="text-[#787583] text-[13px] mt-2 mb-6 leading-relaxed">
            Akun Anda (<strong>{userName}</strong>) belum pernah mengajukan peminjaman ruangan. Daftar ruangan yang terisi pada menu <strong>Jadwal Ruangan</strong> merupakan agenda dari seluruh civitas kampus yang telah disetujui.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('ajukan')}
                className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] transition-colors shadow-sm cursor-pointer"
              >
                + Ajukan Peminjaman Sekarang
              </button>
            )}
            <button
              onClick={() => setActiveTab('kampus')}
              className="border border-[rgba(201,196,212,0.8)] hover:bg-[#f8f9fa] text-[#111c2d] text-[13px] font-semibold px-4 py-2.5 rounded-[10px] transition-colors cursor-pointer"
            >
              Lihat Agenda Kampus Disetujui ({campusItems.length})
            </button>
          </div>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-[#787583] text-[14px]">
            {isSayaTab
              ? 'Tidak ada data pengajuan Anda yang sesuai dengan filter pencarian.'
              : 'Tidak ada agenda kampus yang sesuai dengan filter pencarian.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {currentList.map(item => {
            const s = statusStyle[item.status] || { bg: '#f0f1f5', border: '#ddd', text: '#787583', label: item.status, icon: '•' };
            return (
              <div
                key={item.id}
                className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[14px] p-5 shadow-[0px_1px_3px_rgba(30,41,59,0.04)] hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#111c2d] text-[14px] font-bold">{item.nama_kegiatan}</span>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
                      >
                        {s.icon} {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#787583]">
                      <span className="text-[#4b3f9e] font-mono font-medium">{item.ticket_number}</span>
                      {!isSayaTab && (
                        <span>
                          Pemohon: <strong className="text-[#111c2d]">{item.user?.name || item.organisasi}</strong> {item.organisasi && item.user?.name ? `(${item.organisasi})` : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-[#787583] text-[12px]">
                      {item.room?.name || '-'} · {item.tanggal} · {item.jam_mulai}–{item.jam_selesai} WIB · {item.estimasi_peserta} peserta
                    </span>
                    {item.status === 'ditolak' && item.reject_note && (
                      <div className="mt-2 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
                        <span className="text-red-700 text-[11px]"><strong>Alasan:</strong> {item.reject_note}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSayaTab && item.status === 'menunggu' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleCancel(item.id); }}
                        disabled={cancelingId === item.id}
                        className="text-[12px] text-red-600 border border-red-200 rounded-[8px] px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {cancelingId === item.id ? 'Membatalkan...' : 'Batalkan'}
                      </button>
                    )}
                    <span className="text-[#787583] text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : item.tanggal}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-[520px] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[rgba(201,196,212,0.3)] flex items-center justify-between">
              <h3 className="text-[#111c2d] text-[16px] font-bold">Detail Pengajuan Ruangan</h3>
              <button onClick={() => setSelectedItem(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f6fa] text-[#787583] cursor-pointer">✕</button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-3">
              {[
                ['No. Tiket', selectedItem.ticket_number],
                ['Nama Kegiatan', selectedItem.nama_kegiatan],
                ['Pemohon', selectedItem.user?.name || '-'],
                ['Organisasi', selectedItem.organisasi],
                ['Jenis Kegiatan', selectedItem.jenis_kegiatan || '-'],
                ['Ruangan', selectedItem.room?.name || '-'],
                ['Tanggal', selectedItem.tanggal],
                ['Waktu', `${selectedItem.jam_mulai} – ${selectedItem.jam_selesai} WIB`],
                ['Estimasi Peserta', `${selectedItem.estimasi_peserta} orang`],
                ['Status', selectedItem.status.toUpperCase()],
                ...(selectedItem.reject_note ? [['Alasan Penolakan', selectedItem.reject_note]] : []),
                ...(selectedItem.keperluan ? [['Keperluan', selectedItem.keperluan]] : []),
                ...(selectedItem.catatan ? [['Catatan', selectedItem.catatan]] : []),
                ...(selectedItem.berkas_name ? [['Berkas', selectedItem.berkas_name]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-[#787583] text-[12px] w-[140px] shrink-0">{label}</span>
                  <span className="text-[#111c2d] text-[13px] font-medium flex-1">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
