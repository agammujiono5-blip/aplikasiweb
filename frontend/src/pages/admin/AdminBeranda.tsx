interface AdminBerandaProps {
  onNavigate: (page: string) => void;
}

const stats = [
  { label: 'Total Pengajuan Masuk', value: '24', sub: 'Bulan Oktober 2024', color: '#4b3f9e', bg: '#ece9fe', delta: '+8 dari bulan lalu' },
  { label: 'Menunggu Verifikasi', value: '7', sub: 'Perlu diproses segera', color: '#b45309', bg: '#fef3c7', delta: '3 sudah > 2 hari' },
  { label: 'Disetujui Bulan Ini', value: '14', sub: '58% dari total pengajuan', color: '#065f46', bg: '#d1fae5', delta: '↑ dari bulan lalu' },
  { label: 'Ditolak Bulan Ini', value: '3', sub: '12% tingkat penolakan', color: '#991b1b', bg: '#fee2e2', delta: '↓ dari bulan lalu' },
];

const pendingItems = [
  { id: '#RNG-2024-8841', title: 'Seminar Nasional Teknologi AI', room: 'Auditorium Rektorat Lt. 3', date: '25 Okt 2024', requester: 'Rizky Dharma', org: 'BEM Fasilkom', days: 2 },
  { id: '#RNG-2024-8902', title: 'Workshop Robotik Tingkat Nasional', room: 'Aula Gedung A', date: '28 Okt 2024', requester: 'Siti Nurhaliza', org: 'Himpunan Teknik Elektro', days: 1 },
  { id: '#RNG-2024-8915', title: 'Seminar Kewirausahaan Mahasiswa', room: 'Ruang Seminar C-205', date: '30 Okt 2024', requester: 'Ahmad Fauzi', org: 'BEM Universitas', days: 0 },
];

const roomUsage = [
  { name: 'Auditorium Rektorat', usage: 87, bookings: 13 },
  { name: 'Aula Gedung A', usage: 72, bookings: 11 },
  { name: 'Lab Multimedia Fasilkom', usage: 65, bookings: 10 },
  { name: 'Ruang Seminar C-205', usage: 48, bookings: 7 },
  { name: 'Lab Komputer B-101', usage: 33, bookings: 5 },
];

export default function AdminBeranda({ onNavigate }: AdminBerandaProps) {
  return (
    <div className="px-6 lg:px-8 py-6 max-w-[1040px] flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[#787583] text-[13px]">Selamat datang kembali,</p>
          <h1 className="text-[#111c2d] text-[26px] font-bold tracking-[-0.5px]">Bpk. Hendra 👋</h1>
          <p className="text-[#474552] text-[13px]">Petugas Sarpras · Senin, 25 Oktober 2024</p>
        </div>
        <div className="shrink-0 flex gap-2">
          <button
            onClick={() => onNavigate('pengajuan')}
            className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors flex items-center gap-2"
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
        <div className="flex items-start gap-3 bg-[#fef3c7] border border-[#fde68a] rounded-[10px] px-5 py-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#92400e] text-[13px] font-semibold">Ada pengajuan yang menunggu lebih dari 2 hari</span>
            <span className="text-[#92400e] text-[12px]">3 pengajuan sudah menunggu verifikasi lebih lama dari batas waktu standar.</span>
          </div>
          <button onClick={() => onNavigate('pengajuan')} className="shrink-0 text-[#b45309] text-[12px] font-semibold hover:underline ml-auto">Tinjau →</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-col gap-2 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
            <span className="text-[#787583] text-[12px]">{s.label}</span>
            <span className="text-[28px] font-bold leading-none" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[#787583] text-[11px]">{s.sub}</span>
            <span className="text-[11px] font-medium" style={{ color: s.color }}>{s.delta}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending list */}
        <div className="lg:col-span-7 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">Pengajuan Menunggu Verifikasi</h3>
            <button onClick={() => onNavigate('pengajuan')} className="text-[#4b3f9e] text-[12px] font-semibold hover:underline">Lihat semua</button>
          </div>
          <div className="flex flex-col divide-y divide-[rgba(201,196,212,0.3)]">
            {pendingItems.map(item => (
              <div key={item.id} className="px-5 py-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0 mt-0.5 text-[14px]">⏳</div>
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
                  <button className="w-7 h-7 rounded-[6px] bg-[#d1fae5] flex items-center justify-center hover:bg-[#a7f3d0] transition-colors" title="Setujui">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <button className="w-7 h-7 rounded-[6px] bg-[#fee2e2] flex items-center justify-center hover:bg-[#fecdd3] transition-colors" title="Tolak">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room usage */}
        <div className="lg:col-span-5 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">Penggunaan Ruangan</h3>
            <span className="text-[#787583] text-[11px]">Okt 2024</span>
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
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${r.usage}%`,
                      backgroundColor: r.usage > 75 ? '#4b3f9e' : r.usage > 50 ? '#6c5ce7' : '#a29bfe',
                    }}
                  />
                </div>
                <span className="text-[#787583] text-[10px]">{r.usage}% kapasitas terisi</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
