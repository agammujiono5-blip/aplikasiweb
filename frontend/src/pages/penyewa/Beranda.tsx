const assetPathPrefix = '/assets';
const imgBuilding = `${assetPathPrefix}/1ee4a.svg`;
const imgClock = `${assetPathPrefix}/50b05.svg`;
const imgCalendar = `${assetPathPrefix}/d7354.svg`;
const imgCheck = `${assetPathPrefix}/09465.svg`;

interface BerandaProps {
  onNavigate: (page: string) => void;
}

const stats = [
  { label: 'Total Pengajuan', value: '5', sub: 'Sepanjang semester ini', color: '#4b3f9e', bg: '#ece9fe' },
  { label: 'Disetujui', value: '2', sub: '40% dari total pengajuan', color: '#065f46', bg: '#d1fae5' },
  { label: 'Menunggu Verifikasi', value: '2', sub: 'Sedang diproses', color: '#92400e', bg: '#fef3c7' },
  { label: 'Ditolak', value: '1', sub: 'Perlu ajukan ulang', color: '#991b1b', bg: '#fee2e2' },
];

const recentActivity = [
  { id: '#RNG-2024-8841', title: 'Seminar Nasional Teknologi AI & Workshop Cloud 2024', room: 'Auditorium Rektorat Lt. 3', date: '25 Okt 2024', status: 'menunggu', statusLabel: 'Menunggu Verifikasi' },
  { id: '#RNG-2024-8710', title: 'Pelatihan UI/UX Design & Coding Sprint', room: 'Lab Multimedia Fasilkom', date: '26 Okt 2024', status: 'disetujui', statusLabel: 'Disetujui' },
  { id: '#RNG-2024-8622', title: 'Rapat Kerja Anggota Himpunan', room: 'Ruang Seminar F-201', date: '21 Okt 2024', status: 'ditolak', statusLabel: 'Ditolak' },
];

const availableRooms = [
  { name: 'Aula Gedung A', capacity: 300, facilities: 'Proyektor, Sound System, AC', available: true },
  { name: 'Lab Komputer B-101', capacity: 40, facilities: 'PC Workstation, AC', available: true },
  { name: 'Ruang Seminar C-205', capacity: 80, facilities: 'Proyektor, Whiteboard, AC', available: false },
  { name: 'Ruang Rapat Dekanat', capacity: 20, facilities: 'TV LED, AC', available: true },
];

const statusStyle: Record<string, { bg: string; border: string; text: string }> = {
  menunggu: { bg: '#fef3c7', border: '#fde68a', text: '#92400e' },
  disetujui: { bg: '#d1fae5', border: '#a7f3d0', text: '#065f46' },
  ditolak: { bg: '#fee2e2', border: '#fecdd3', text: '#991b1b' },
};

export default function Beranda({ onNavigate }: BerandaProps) {
  return (
    <div className="px-6 lg:px-8 py-6 max-w-[1040px] flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Welcome banner */}
      <div
        className="rounded-[16px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #342586 0%, #4b3f9e 60%, #6c5ce7 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-32 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col gap-1">
          <p className="text-white/70 text-[13px] font-normal">Selamat datang kembali,</p>
          <h2 className="text-white text-[22px] font-bold tracking-[-0.4px]">Rizky Dharma 👋</h2>
          <p className="text-white/60 text-[13px] mt-1">NIM: 2021001234 · Teknik Informatika</p>
        </div>
        <button
          onClick={() => onNavigate('ajukan')}
          className="relative z-10 shrink-0 flex items-center gap-2 bg-white text-[#4b3f9e] text-[14px] font-semibold px-5 py-[10px] rounded-[10px] hover:bg-white/90 transition-colors shadow-md"
        >
          + Ajukan Peminjaman
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-col gap-2 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[#787583] text-[12px] font-normal">{s.label}</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                <span className="text-[11px] font-bold" style={{ color: s.color }}>→</span>
              </div>
            </div>
            <span className="text-[#111c2d] text-[28px] font-bold leading-none" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[#787583] text-[11px]">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-7 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">Aktivitas Terbaru</h3>
            <button onClick={() => onNavigate('riwayat')} className="text-[#4b3f9e] text-[12px] font-semibold hover:underline">Lihat semua</button>
          </div>
          <div className="flex flex-col divide-y divide-[rgba(201,196,212,0.3)]">
            {recentActivity.map(item => {
              const s = statusStyle[item.status];
              return (
                <div key={item.id} className="flex items-start gap-3 px-5 py-4">
                  <div className="w-8 h-8 rounded-full bg-[#ece9fe] flex items-center justify-center shrink-0 mt-0.5">
                    <img alt="" src={imgBuilding} className="w-[14px] h-[12px]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[#111c2d] text-[13px] font-semibold leading-snug line-clamp-1">{item.title}</span>
                      <span
                        className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[#787583] text-[11px]">
                      <span>{item.id}</span>
                      <span>·</span>
                      <span>{item.room}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#787583] text-[11px]">
                      <img alt="" src={imgCalendar} className="w-[10px] h-[11px]" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available rooms */}
        <div className="lg:col-span-5 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">Ruangan Tersedia</h3>
            <button onClick={() => onNavigate('jadwal')} className="text-[#4b3f9e] text-[12px] font-semibold hover:underline">Lihat jadwal</button>
          </div>
          <div className="flex flex-col divide-y divide-[rgba(201,196,212,0.3)]">
            {availableRooms.map(room => (
              <div key={room.name} className="px-5 py-3.5 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#111c2d] text-[13px] font-semibold">{room.name}</span>
                  <span className="text-[#787583] text-[11px]">Kapasitas: {room.capacity} orang</span>
                  <span className="text-[#787583] text-[11px]">{room.facilities}</span>
                </div>
                <span
                  className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full mt-0.5"
                  style={{
                    backgroundColor: room.available ? '#d1fae5' : '#fee2e2',
                    color: room.available ? '#065f46' : '#991b1b',
                  }}
                >
                  {room.available ? 'Tersedia' : 'Terpakai'}
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-[rgba(201,196,212,0.3)]">
            <button
              onClick={() => onNavigate('ajukan')}
              className="w-full bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold py-2.5 rounded-[8px] transition-colors"
            >
              + Ajukan Peminjaman Ruangan
            </button>
          </div>
        </div>
      </div>

      {/* Quick tips */}
      <div className="bg-[rgba(240,243,255,0.7)] border border-[rgba(201,196,212,0.4)] rounded-[12px] p-5 flex flex-col gap-3">
        <h3 className="text-[#342586] text-[14px] font-semibold flex items-center gap-2">
          <img alt="" src={imgCheck} className="w-[12px] h-[9px]" />
          Tips Pengajuan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: imgClock, title: 'Ajukan H-3', desc: 'Pengajuan minimal 3 hari sebelum kegiatan untuk proses verifikasi.' },
            { icon: imgBuilding, title: 'Cek Ketersediaan', desc: 'Pastikan ruangan tidak terpakai di tanggal yang diinginkan.' },
            { icon: imgCalendar, title: 'Lengkapi Berkas', desc: 'Unggah surat permohonan dan proposal kegiatan untuk mempercepat proses.' },
          ].map(tip => (
            <div key={tip.title} className="flex gap-3 items-start">
              <div className="w-7 h-7 bg-[#ece9fe] rounded-[8px] flex items-center justify-center shrink-0">
                <img alt="" src={tip.icon} className="w-[13px] h-[13px]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[#342586] text-[12px] font-semibold">{tip.title}</span>
                <span className="text-[#474552] text-[11px] leading-relaxed">{tip.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
