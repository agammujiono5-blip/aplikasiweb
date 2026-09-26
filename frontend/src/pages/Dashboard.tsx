import { useState } from 'react';
import { api, useLiveQuery } from '../api/client';
import type { PeminjamanItem } from '../api/client';

type FilterTab = 'Semua' | 'Menunggu Verifikasi' | 'Disetujui' | 'Ditolak';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard(_props: DashboardProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('Semua');
  const [search, setSearch] = useState('');

  // Live real-time polling
  const { data: allHistory, loading, refetch } = useLiveQuery(
    () => api.peminjaman.getUserHistory(),
    []
  );

  const history = allHistory || [];

  const tabCounts = {
    'Semua': history.length,
    'Menunggu Verifikasi': history.filter(h => h.status === 'menunggu').length,
    'Disetujui': history.filter(h => h.status === 'disetujui').length,
    'Ditolak': history.filter(h => h.status === 'ditolak').length,
  };

  const tabs: { label: FilterTab; count: number; badgeBg: string; badgeColor: string }[] = [
    { label: 'Semua', count: tabCounts['Semua'], badgeBg: '#4b3f9e', badgeColor: 'white' },
    { label: 'Menunggu Verifikasi', count: tabCounts['Menunggu Verifikasi'], badgeBg: '#fef3c7', badgeColor: '#92400e' },
    { label: 'Disetujui', count: tabCounts['Disetujui'], badgeBg: '#d1fae5', badgeColor: '#065f46' },
    { label: 'Ditolak', count: tabCounts['Ditolak'], badgeBg: '#fee2e2', badgeColor: '#991b1b' },
  ];

  const filtered = history.filter(h => {
    let matchTab = true;
    if (activeTab === 'Menunggu Verifikasi') matchTab = h.status === 'menunggu';
    if (activeTab === 'Disetujui') matchTab = h.status === 'disetujui';
    if (activeTab === 'Ditolak') matchTab = h.status === 'ditolak';

    const matchSearch =
      !search ||
      h.nama_kegiatan.toLowerCase().includes(search.toLowerCase()) ||
      h.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      (h.room?.name || '').toLowerCase().includes(search.toLowerCase());

    return matchTab && matchSearch;
  });

  const handleCancel = async (item: PeminjamanItem) => {
    if (!confirm(`Yakin ingin membatalkan pengajuan ${item.ticket_number}?`)) return;
    try {
      await api.peminjaman.cancelUser(item.id);
      await refetch();
    } catch (err) {
      alert('Gagal membatalkan: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="flex flex-col gap-6 px-6 lg:px-10 py-6 w-full max-w-full pb-16" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[#111c2d] text-[28px] lg:text-[32px] font-bold tracking-[-0.8px] leading-[40px]">
              Riwayat &amp; Status Pengajuan Saya
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mt-1" />
          </div>
          <p className="text-[#474552] text-[14px] font-normal leading-[20px]">
            Pantau progres persetujuan peminjaman ruang dan peralatan kampus secara real-time.
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-4 shadow-[0px_1px_3px_0px_rgba(30,41,59,0.04)]">
        <div className="flex items-center gap-1 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] transition-colors text-[14px] font-semibold cursor-pointer
                ${activeTab === tab.label ? 'bg-[#ece9fe] text-[#4b3f9e]' : 'text-[#474552] hover:bg-[#f5f6fa]'}`}
            >
              {tab.label}
              <span
                className="text-[11px] font-bold px-2 py-[2px] rounded-full"
                style={{
                  backgroundColor: tab.label === 'Semua'
                    ? (activeTab === 'Semua' ? '#4b3f9e' : '#e8e5f8')
                    : tab.badgeBg,
                  color: tab.label === 'Semua'
                    ? (activeTab === 'Semua' ? 'white' : '#4b3f9e')
                    : tab.badgeColor,
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-[300px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787583]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Cari kegiatan atau kode tiket..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-[44px] bg-white border border-[rgba(201,196,212,0.7)] rounded-[8px] pl-10 pr-4 text-[14px] text-[#111c2d] placeholder-[#787583] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-4">
        {loading && history.length === 0 ? (
          <div className="bg-white border rounded-[12px] p-12 text-center text-[#787583] text-[14px]">
            Memuat data pengajuan Anda dari database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border rounded-[12px] p-12 text-center text-[#787583] text-[14px]">
            Tidak ada pengajuan pada tab ini.
          </div>
        ) : (
          filtered.map(item => {
            const isApproved = item.status === 'disetujui';
            const isPending = item.status === 'menunggu';
            const isRejected = item.status === 'ditolak';

            return (
              <div
                key={item.id}
                className="bg-white border border-[rgba(201,196,212,0.6)] rounded-[12px] p-6 shadow-sm flex flex-col gap-4"
              >
                {/* Header Ticket */}
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(201,196,212,0.3)]">
                  <div className="flex items-center gap-4">
                    <span className="text-[#342586] text-[14px] font-bold font-mono">{item.ticket_number}</span>
                    <span className="text-[#787583] text-[12px]">•</span>
                    <span className="text-[#474552] text-[12px]">Diajukan: {item.tanggal}</span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 border text-[11px] font-semibold tracking-[0.275px] uppercase"
                    style={{
                      backgroundColor: isApproved ? '#d1fae5' : isPending ? '#fef3c7' : '#fee2e2',
                      borderColor: isApproved ? '#a7f3d0' : isPending ? '#fde68a' : '#fecdd3',
                      color: isApproved ? '#065f46' : isPending ? '#92400e' : '#991b1b',
                    }}
                  >
                    {isApproved ? 'DISETUJUI' : isPending ? 'MENUNGGU VERIFIKASI' : 'DITOLAK'}
                  </div>
                </div>

                {/* Body Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#342586] text-[12px] font-semibold">🏢 {item.room?.name || 'Ruangan Kampus'}</span>
                    </div>
                    <h3 className="text-[#111c2d] text-[20px] font-semibold leading-[28px]">{item.nama_kegiatan}</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                      <div className="text-[#474552] text-[12px]">⏰ {item.tanggal} | {item.jam_mulai} - {item.jam_selesai} WIB</div>
                      <div className="text-[#474552] text-[12px]">👥 {item.organisasi}</div>
                      <div className="text-[#474552] text-[12px]">👤 Estimasi: {item.estimasi_peserta} Orang Peserta</div>
                      <div className="text-[#474552] text-[12px]">🛠️ Fasilitas: {item.fasilitas ? item.fasilitas.join(', ') : 'Standar'}</div>
                    </div>
                    {item.berkas_url && (
                      <div className="pt-2">
                        <a
                          href={item.berkas_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#ece9fe]/60 hover:bg-[#ece9fe] text-[#4b3f9e] text-[12px] font-semibold border border-[rgba(75,63,158,0.2)] transition-colors w-fit"
                        >
                          <span>📄</span> Unduh Berkas Lampiran ({item.berkas_name || 'Dokumen'})
                        </a>
                      </div>
                    )}
                    {item.reject_note && (
                      <div className="mt-2 p-3 bg-[#fee2e2]/60 border border-[#fecdd3] rounded-[8px] text-[12px] text-[#991b1b]">
                        <strong>Alasan Penolakan:</strong> {item.reject_note}
                      </div>
                    )}
                  </div>

                  {/* Flow tracker */}
                  <div className="lg:col-span-5 bg-[rgba(240,243,255,0.6)] border border-[rgba(201,196,212,0.3)] rounded-[12px] p-4 flex flex-col gap-3 min-h-[138px] justify-between">
                    <span className="text-[#474552] text-[11px] font-semibold tracking-[0.6px] uppercase">ALUR VERIFIKASI PEMINJAMAN</span>
                    <div className="relative flex items-center justify-between px-1">
                      <div className="absolute left-6 right-6 top-4 h-[2px] bg-[rgba(201,196,212,0.4)]" />
                      <div
                        className="absolute left-6 top-4 h-[2px]"
                        style={{
                          backgroundColor: isRejected ? '#ba1a1a' : '#4b3f9e',
                          right: isApproved ? '6px' : '50%',
                        }}
                      />
                      {/* Step 1: Terkirim */}
                      <div className="flex flex-col items-center gap-1.5 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-[#4b3f9e] text-white flex items-center justify-center text-[12px] font-bold">
                          ✓
                        </div>
                        <span className="text-[#111c2d] text-[11px] font-medium">Terkirim</span>
                      </div>
                      {/* Step 2: Review */}
                      <div className="flex flex-col items-center gap-1.5 relative z-10">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                          style={{
                            backgroundColor: isApproved ? '#4b3f9e' : isPending ? '#fef3c7' : '#fee2e2',
                            color: isApproved ? 'white' : isPending ? '#b45309' : '#991b1b',
                            border: isPending ? '2px solid #b45309' : 'none',
                          }}
                        >
                          {isApproved ? '✓' : isPending ? '⏳' : '✕'}
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: isApproved ? '#4b3f9e' : isPending ? '#b45309' : '#991b1b' }}>
                          Review Sarpras
                        </span>
                      </div>
                      {/* Step 3: Final */}
                      <div className="flex flex-col items-center gap-1.5 relative z-10">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                          style={{
                            backgroundColor: isApproved ? '#065f46' : '#d8e3fb',
                            color: isApproved ? 'white' : '#787583',
                          }}
                        >
                          {isApproved ? '✓' : '3'}
                        </div>
                        <span className="text-[11px] font-medium text-[#787583]">
                          Persetujuan Final
                        </span>
                      </div>
                    </div>
                    <p className="text-[#474552] text-[12px] italic text-center">
                      {isApproved
                        ? 'Pengajuan telah disetujui. Ruangan siap digunakan sesuai jadwal.'
                        : isPending
                        ? 'Sedang direview oleh petugas pengelola Sarana & Prasarana secara real-time.'
                        : 'Pengajuan ditolak. Silakan ajukan ulang dengan ruangan atau tanggal lain.'}
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[rgba(201,196,212,0.2)]">
                    <button
                      onClick={() => handleCancel(item)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[#ba1a1a] text-[14px] font-semibold hover:bg-[#fee2e2]/40 transition-colors cursor-pointer"
                    >
                      Batalkan Pengajuan
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
