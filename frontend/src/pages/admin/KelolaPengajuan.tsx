import { useState } from 'react';

type Status = 'menunggu' | 'disetujui' | 'ditolak';

interface Pengajuan {
  id: string;
  title: string;
  requester: string;
  org: string;
  room: string;
  date: string;
  time: string;
  peserta: number;
  submitted: string;
  status: Status;
  fasilitas: string[];
}

const allPengajuan: Pengajuan[] = [
  { id: '#RNG-2024-8841', title: 'Seminar Nasional Teknologi AI & Workshop Cloud 2024', requester: 'Rizky Dharma', org: 'BEM Fasilkom', room: 'Auditorium Rektorat Lt. 3', date: '25 Okt 2024', time: '08:00–12:30', peserta: 220, submitted: '24 Okt 2024', status: 'menunggu', fasilitas: ['Proyektor', 'Sound System', 'AC'] },
  { id: '#RNG-2024-8902', title: 'Workshop Robotik Tingkat Nasional', requester: 'Siti Nurhaliza', org: 'Himpunan Teknik Elektro', room: 'Aula Gedung A', date: '28 Okt 2024', time: '09:00–17:00', peserta: 150, submitted: '23 Okt 2024', status: 'menunggu', fasilitas: ['Proyektor', 'AC'] },
  { id: '#RNG-2024-8915', title: 'Seminar Kewirausahaan Mahasiswa', requester: 'Ahmad Fauzi', org: 'BEM Universitas', room: 'Ruang Seminar C-205', date: '30 Okt 2024', time: '09:00–12:00', peserta: 60, submitted: '24 Okt 2024', status: 'menunggu', fasilitas: ['Proyektor', 'Whiteboard'] },
  { id: '#RNG-2024-8710', title: 'Pelatihan UI/UX Design & Coding Sprint', requester: 'Rizky Dharma', org: 'BEM Fasilkom', room: 'Lab Multimedia Fasilkom', date: '26 Okt 2024', time: '09:00–15:00', peserta: 40, submitted: '20 Okt 2024', status: 'disetujui', fasilitas: ['PC Workstation', 'AC'] },
  { id: '#RNG-2024-8622', title: 'Rapat Kerja Anggota Himpunan', requester: 'Rizky Dharma', org: 'Himpunan Mahasiswa IF', room: 'Ruang Seminar F-201', date: '21 Okt 2024', time: '13:00–17:00', peserta: 50, submitted: '15 Okt 2024', status: 'ditolak', fasilitas: ['Whiteboard'] },
];

const statusStyle: Record<Status, { bg: string; border: string; text: string; label: string }> = {
  menunggu: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', label: 'Menunggu' },
  disetujui: { bg: '#d1fae5', border: '#a7f3d0', text: '#065f46', label: 'Disetujui' },
  ditolak: { bg: '#fee2e2', border: '#fecdd3', text: '#991b1b', label: 'Ditolak' },
};

export default function KelolaPengajuan() {
  const [activeTab, setActiveTab] = useState<'semua' | Status>('semua');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Pengajuan | null>(null);
  const [data, setData] = useState(allPengajuan);
  const [rejectNote, setRejectNote] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const tabs: { key: 'semua' | Status; label: string; count: number }[] = [
    { key: 'semua', label: 'Semua', count: data.length },
    { key: 'menunggu', label: 'Menunggu Verifikasi', count: data.filter(d => d.status === 'menunggu').length },
    { key: 'disetujui', label: 'Disetujui', count: data.filter(d => d.status === 'disetujui').length },
    { key: 'ditolak', label: 'Ditolak', count: data.filter(d => d.status === 'ditolak').length },
  ];

  const filtered = data.filter(d => {
    const matchTab = activeTab === 'semua' || d.status === activeTab;
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()) || d.requester.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleApprove = (item: Pengajuan) => {
    setData(prev => prev.map(d => d.id === item.id ? { ...d, status: 'disetujui' as Status } : d));
    setSelected(null);
    setAction(null);
  };

  const handleReject = (item: Pengajuan) => {
    setData(prev => prev.map(d => d.id === item.id ? { ...d, status: 'ditolak' as Status } : d));
    setSelected(null);
    setAction(null);
    setRejectNote('');
  };

  return (
    <div className="px-6 lg:px-8 py-6 max-w-[1040px] flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Kelola Pengajuan</h1>
        <p className="text-[#474552] text-[14px]">Tinjau, setujui, atau tolak pengajuan peminjaman ruang dari mahasiswa.</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-4 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
        <div className="flex items-center gap-1 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors
                ${activeTab === tab.key ? 'bg-[#fff3cd] text-[#b45309]' : 'text-[#474552] hover:bg-[#f5f6fa]'}`}
            >
              {tab.label}
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: activeTab === tab.key ? '#fde68a' : '#f0f1f5',
                  color: activeTab === tab.key ? '#92400e' : '#787583',
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-[260px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787583]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama kegiatan, ID, pemohon..."
            className="w-full h-[40px] bg-white border border-[rgba(201,196,212,0.7)] rounded-[8px] pl-9 pr-4 text-[13px] text-[#111c2d] placeholder-[#787583] outline-none focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/10 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(201,196,212,0.3)] bg-[#f8f9fc]">
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide">ID / Kegiatan</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide hidden sm:table-cell">Pemohon</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide hidden lg:table-cell">Ruangan</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide hidden lg:table-cell">Tanggal</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,196,212,0.2)]">
              {filtered.map(item => {
                const s = statusStyle[item.status];
                return (
                  <tr key={item.id} className="hover:bg-[#f8f9fc] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#342586] text-[12px] font-bold">{item.id}</span>
                        <span className="text-[#111c2d] text-[13px] font-semibold line-clamp-1">{item.title}</span>
                        <span className="text-[#787583] text-[11px] sm:hidden">{item.requester}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#111c2d] text-[13px] font-medium">{item.requester}</span>
                        <span className="text-[#787583] text-[11px]">{item.org}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-[#474552] text-[12px]">{item.room}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#474552] text-[12px]">{item.date}</span>
                        <span className="text-[#787583] text-[11px]">{item.time}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                        style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setSelected(item); setAction(null); }}
                          className="text-[#4b3f9e] text-[12px] font-semibold hover:underline"
                        >
                          Detail
                        </button>
                        {item.status === 'menunggu' && (
                          <>
                            <span className="text-[#c9c4d4]">|</span>
                            <button onClick={() => handleApprove(item)} className="text-[#065f46] text-[12px] font-semibold hover:underline">Setujui</button>
                            <span className="text-[#c9c4d4]">|</span>
                            <button onClick={() => { setSelected(item); setAction('reject'); }} className="text-[#991b1b] text-[12px] font-semibold hover:underline">Tolak</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[#787583] text-[13px]">Tidak ada pengajuan yang cocok.</div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/30" onClick={() => { setSelected(null); setAction(null); }} />
          <div className="w-full max-w-[440px] bg-white h-full overflow-y-auto flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(201,196,212,0.3)] sticky top-0 bg-white z-10">
              <div>
                <p className="text-[#342586] text-[12px] font-bold">{selected.id}</p>
                <h3 className="text-[#111c2d] text-[16px] font-bold leading-snug mt-0.5">{selected.title}</h3>
              </div>
              <button onClick={() => { setSelected(null); setAction(null); }} className="w-8 h-8 rounded-full bg-[#f5f6fa] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border`}
                  style={{ backgroundColor: statusStyle[selected.status].bg, borderColor: statusStyle[selected.status].border, color: statusStyle[selected.status].text }}>
                  {statusStyle[selected.status].label}
                </span>
                <span className="text-[#787583] text-[12px]">Diajukan: {selected.submitted}</span>
              </div>

              {[
                { label: 'Pemohon', value: selected.requester },
                { label: 'Organisasi', value: selected.org },
                { label: 'Ruangan', value: selected.room },
                { label: 'Tanggal', value: selected.date },
                { label: 'Waktu', value: `${selected.time} WIB` },
                { label: 'Estimasi Peserta', value: `${selected.peserta} orang` },
                { label: 'Fasilitas', value: selected.fasilitas.join(', ') },
              ].map(row => (
                <div key={row.label} className="flex flex-col gap-1 border-b border-[rgba(201,196,212,0.2)] pb-3 last:border-0">
                  <span className="text-[#787583] text-[11px] font-semibold uppercase tracking-wide">{row.label}</span>
                  <span className="text-[#111c2d] text-[14px]">{row.value}</span>
                </div>
              ))}

              {action === 'reject' && (
                <div className="flex flex-col gap-2 bg-[#fee2e2] border border-[#fecdd3] rounded-[10px] p-4">
                  <label className="text-[#991b1b] text-[13px] font-semibold">Alasan Penolakan <span className="text-[#ba1a1a]">*</span></label>
                  <textarea
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Tuliskan alasan penolakan untuk disampaikan kepada pemohon..."
                    rows={3}
                    className="border border-[#fecdd3] rounded-[8px] px-3 py-2 text-[13px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#991b1b] resize-none bg-white"
                  />
                </div>
              )}
            </div>

            {selected.status === 'menunggu' && (
              <div className="px-6 py-5 border-t border-[rgba(201,196,212,0.3)] flex flex-col gap-3 sticky bottom-0 bg-white">
                {action === null && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selected)}
                      className="flex-1 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[14px] font-semibold py-3 rounded-[10px] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Setujui
                    </button>
                    <button
                      onClick={() => setAction('reject')}
                      className="flex-1 bg-[#fee2e2] hover:bg-[#fecdd3] text-[#991b1b] text-[14px] font-semibold py-3 rounded-[10px] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Tolak
                    </button>
                  </div>
                )}
                {action === 'reject' && (
                  <div className="flex gap-3">
                    <button onClick={() => setAction(null)} className="flex-1 border border-[rgba(201,196,212,0.7)] text-[#474552] text-[14px] font-semibold py-3 rounded-[10px] hover:bg-[#f5f6fa]">Batal</button>
                    <button
                      onClick={() => handleReject(selected)}
                      disabled={!rejectNote}
                      className="flex-1 bg-[#991b1b] hover:bg-[#ba1a1a] disabled:opacity-40 text-white text-[14px] font-semibold py-3 rounded-[10px] transition-colors"
                    >
                      Konfirmasi Tolak
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
