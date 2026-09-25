import { useState } from 'react';

const assetPathPrefix = '/assets';
const imgPlus = `${assetPathPrefix}/894d7.svg`;
const imgSearch = `${assetPathPrefix}/ff0d6.svg`;
const imgCalendar = `${assetPathPrefix}/d7354.svg`;
const imgHourglass = `${assetPathPrefix}/0a8df.svg`;
const imgBuilding = `${assetPathPrefix}/1ee4a.svg`;
const imgClock = `${assetPathPrefix}/50b05.svg`;
const imgGroup = `${assetPathPrefix}/7cd71.svg`;
const imgPerson = `${assetPathPrefix}/53137.svg`;
const imgProjector = `${assetPathPrefix}/98f73.svg`;
const imgCheck = `${assetPathPrefix}/09465.svg`;
const imgReview = `${assetPathPrefix}/8dedc.svg`;
const imgFinal = `${assetPathPrefix}/7867d.svg`;
const imgCancel = `${assetPathPrefix}/50d5d.svg`;
const imgDoc = `${assetPathPrefix}/e87cb.svg`;
const imgCheckGreen = `${assetPathPrefix}/bfdb1.svg`;
const imgMonitor = `${assetPathPrefix}/a9f56.svg`;
const imgCapacity = `${assetPathPrefix}/58200.svg`;
const imgApprovedIcon = `${assetPathPrefix}/aa81c.svg`;
const imgQR = `${assetPathPrefix}/8a111.svg`;
const imgDownload = `${assetPathPrefix}/4b73b.svg`;
const imgCross = `${assetPathPrefix}/ac084.svg`;
const imgRoom = `${assetPathPrefix}/8dce7.svg`;
const imgRejectedIcon = `${assetPathPrefix}/8d5d9.svg`;
const imgNote = `${assetPathPrefix}/2318b.svg`;
const imgReapply = `${assetPathPrefix}/aefad.svg`;
const imgChevLeft = `${assetPathPrefix}/61b8a.svg`;
const imgChevRight = `${assetPathPrefix}/1c63c.svg`;

type FilterTab = 'Semua' | 'Menunggu Verifikasi' | 'Disetujui' | 'Ditolak';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard(_props: DashboardProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('Semua');
  const [search, setSearch] = useState('');

  const tabs: { label: FilterTab; count: number; badgeBg: string; badgeColor: string }[] = [
    { label: 'Semua', count: 5, badgeBg: '#4b3f9e', badgeColor: 'white' },
    { label: 'Menunggu Verifikasi', count: 2, badgeBg: '#fef3c7', badgeColor: '#92400e' },
    { label: 'Disetujui', count: 2, badgeBg: '#d1fae5', badgeColor: '#065f46' },
    { label: 'Ditolak', count: 1, badgeBg: '#fee2e2', badgeColor: '#991b1b' },
  ];

  return (
    <div className="flex flex-col gap-6 px-6 lg:px-8 py-6 max-w-[1040px] w-full pb-16" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#111c2d] text-[28px] lg:text-[32px] font-bold tracking-[-0.8px] leading-[40px]">
            Riwayat &amp; Status Pengajuan Saya
          </h1>
          <p className="text-[#474552] text-[14px] font-normal leading-[20px]">
            Pantau progres persetujuan peminjaman ruang dan peralatan kampus secara real-time.
          </p>
        </div>
        <button className="shrink-0 flex items-center gap-2 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[14px] font-semibold px-5 py-[10px] rounded-[8px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors">
          <img alt="" src={imgPlus} className="w-[12px] h-[12px]" />
          + Ajukan Ruang Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-4 shadow-[0px_1px_3px_0px_rgba(30,41,59,0.04),0px_4px_6px_-1px_rgba(75,63,158,0.03)]">
        <div className="flex items-center gap-1 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] transition-colors text-[14px] font-semibold
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
          <img alt="" src={imgSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px]" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama kegiatan atau kode tiket..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-[44px] bg-white border border-[rgba(201,196,212,0.7)] rounded-[8px] pl-10 pr-4 text-[14px] text-[#111c2d] placeholder-[#787583] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        {/* CARD 1: MENUNGGU VERIFIKASI */}
        {(activeTab === 'Semua' || activeTab === 'Menunggu Verifikasi') && (
          <div className="bg-white border border-[rgba(201,196,212,0.6)] rounded-[12px] p-6 shadow-[0px_1px_3px_0px_rgba(30,41,59,0.04),0px_4px_6px_-1px_rgba(75,63,158,0.03)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(201,196,212,0.3)]">
              <div className="flex items-center gap-4">
                <span className="text-[#342586] text-[14px] font-bold">#RNG-2024-8841</span>
                <span className="text-[#787583] text-[12px]">•</span>
                <div className="flex items-center gap-1">
                  <img alt="" src={imgCalendar} className="w-[12px] h-[13px]" />
                  <span className="text-[#474552] text-[12px]">Diajukan: 24 Okt 2024</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-[#fef3c7] border border-[#fde68a] rounded-full px-3 py-1">
                <img alt="" src={imgHourglass} className="w-[10px] h-[12.5px]" />
                <span className="text-[#92400e] text-[11px] font-semibold tracking-[0.275px]">MENUNGGU VERIFIKASI</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <img alt="" src={imgBuilding} className="w-[15px] h-[13.5px]" />
                  <span className="text-[#342586] text-[12px] font-semibold">Auditorium Gedung Rektorat Lt. 3</span>
                </div>
                <h3 className="text-[#111c2d] text-[20px] font-semibold leading-[28px]">Seminar Nasional Teknologi AI &amp; Workshop Cloud 2024</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                  <div className="flex items-center gap-2"><img alt="" src={imgClock} className="w-[15px] h-[15px]" /><span className="text-[#474552] text-[12px]">Jumat, 25 Okt 2024 | 08:00 - 12:30 WIB</span></div>
                  <div className="flex items-center gap-2"><img alt="" src={imgGroup} className="w-[18px] h-[9px]" /><span className="text-[#474552] text-[12px]">BEM Fakultas Ilmu Komputer</span></div>
                  <div className="flex items-center gap-2"><img alt="" src={imgPerson} className="w-[12px] h-[12px]" /><span className="text-[#474552] text-[12px]">Estimasi: 220 Orang Peserta</span></div>
                  <div className="flex items-center gap-2"><img alt="" src={imgProjector} className="w-[15px] h-[12px]" /><span className="text-[#474552] text-[12px]">Fasilitas: Proyektor, Sound System, AC</span></div>
                </div>
              </div>
              <div className="lg:col-span-5 bg-[rgba(240,243,255,0.6)] border border-[rgba(201,196,212,0.3)] rounded-[12px] p-4 flex flex-col gap-3 min-h-[138px] justify-between">
                <span className="text-[#474552] text-[11px] font-semibold tracking-[0.6px] uppercase">ALUR VERIFIKASI PEMINJAMAN</span>
                <div className="relative flex items-center justify-between px-1">
                  <div className="absolute left-6 right-6 top-4 h-[2px] bg-[rgba(201,196,212,0.4)]" />
                  <div className="absolute left-6 right-[53%] top-4 h-[2px] bg-[#4b3f9e]" />
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-[#4b3f9e] flex items-center justify-center shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                      <img alt="" src={imgCheck} className="w-[10.867px] h-[8.017px]" />
                    </div>
                    <span className="text-[#111c2d] text-[11px] font-medium">Terkirim</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-[#fef3c7] border-2 border-[#b45309] flex items-center justify-center shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                      <img alt="" src={imgReview} className="w-[10.667px] h-[14.667px]" />
                    </div>
                    <span className="text-[#b45309] text-[11px] font-bold">Review Sarpras</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-[#d8e3fb] flex items-center justify-center">
                      <img alt="" src={imgFinal} className="w-[13.333px] h-[13.333px]" />
                    </div>
                    <span className="text-[#787583] text-[11px] font-medium">Persetujuan Final</span>
                  </div>
                </div>
                <p className="text-[#474552] text-[12px] italic text-center">Sedang direview oleh petugas pengelola Sarana &amp; Prasarana.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[rgba(201,196,212,0.2)]">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[#ba1a1a] text-[14px] font-semibold hover:bg-[#fee2e2]/40 transition-colors">
                <img alt="" src={imgCancel} className="w-[15px] h-[15px]" />Batalkan Pengajuan
              </button>
              <button className="flex items-center gap-1.5 bg-[#e7eeff] border border-[rgba(201,196,212,0.5)] px-6 py-2 rounded-[8px] text-[#342586] text-[14px] font-semibold hover:bg-[#d8e3fb] transition-colors">
                <img alt="" src={imgDoc} className="w-[12px] h-[15px]" />Lihat Detail Berkas
              </button>
            </div>
          </div>
        )}

        {/* CARD 2: DISETUJUI */}
        {(activeTab === 'Semua' || activeTab === 'Disetujui') && (
          <div className="bg-white border border-[rgba(201,196,212,0.6)] rounded-[12px] p-6 shadow-[0px_1px_3px_0px_rgba(30,41,59,0.04),0px_4px_6px_-1px_rgba(75,63,158,0.03)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(201,196,212,0.3)]">
              <div className="flex items-center gap-4">
                <span className="text-[#342586] text-[14px] font-bold">#RNG-2024-8710</span>
                <span className="text-[#787583] text-[12px]">•</span>
                <div className="flex items-center gap-1">
                  <img alt="" src={imgCalendar} className="w-[12px] h-[13px]" />
                  <span className="text-[#474552] text-[12px]">Diajukan: 20 Okt 2024</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-[#d1fae5] border border-[#a7f3d0] rounded-full px-3 py-1">
                <img alt="" src={imgCheckGreen} className="w-[12.5px] h-[12.5px]" />
                <span className="text-[#065f46] text-[11px] font-semibold tracking-[0.275px]">DISETUJUI</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <img alt="" src={imgMonitor} className="w-[16.5px] h-[13.5px]" />
                  <span className="text-[#342586] text-[12px] font-semibold">Lab Komputer Multimedia Fasilkom</span>
                </div>
                <h3 className="text-[#111c2d] text-[20px] font-semibold leading-[28px]">Pelatihan UI/UX Design &amp; Coding Sprint</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                  <div className="flex items-center gap-2"><img alt="" src={imgClock} className="w-[15px] h-[15px]" /><span className="text-[#474552] text-[12px]">Sabtu, 26 Okt 2024 | 09:00 - 15:00 WIB</span></div>
                  <div className="flex items-center gap-2"><img alt="" src={imgCapacity} className="w-[13.5px] h-[13.5px]" /><span className="text-[#474552] text-[12px]">Kapasitas: 40 Unit PC Workstation</span></div>
                </div>
              </div>
              <div className="lg:col-span-5 bg-[rgba(209,250,229,0.3)] border border-[#a7f3d0] rounded-[12px] p-4 flex items-start gap-2">
                <img alt="" src={imgApprovedIcon} className="w-[14.667px] h-[20.333px] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-[#065f46] text-[12px] font-bold uppercase tracking-wide">CATATAN PETUGAS SARPRAS</span>
                  <p className="text-[#065f46] text-[14px] leading-[22.75px]">"Disetujui oleh Bpk. Hendra (Sarpras Fasilkom). Kunci ruang dapat diambil di pos satpam H-1."</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[rgba(201,196,212,0.2)]">
              <button className="flex items-center gap-1.5 border border-[#c9c4d4] px-4 py-2 rounded-[8px] text-[#111c2d] text-[14px] font-semibold hover:bg-[#f5f6fa] transition-colors">
                <img alt="" src={imgQR} className="w-[13.5px] h-[13.5px]" />QR Code Masuk Ruang
              </button>
              <button className="flex items-center gap-1.5 bg-[#4b3f9e] hover:bg-[#342586] px-6 py-2 rounded-[8px] text-white text-[14px] font-semibold shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors">
                <img alt="" src={imgDownload} className="w-[12px] h-[12px]" />Unduh Surat Izin (PDF)
              </button>
            </div>
          </div>
        )}

        {/* CARD 3: DITOLAK */}
        {(activeTab === 'Semua' || activeTab === 'Ditolak') && (
          <div className="bg-white border border-[rgba(201,196,212,0.6)] rounded-[12px] p-6 shadow-[0px_1px_3px_0px_rgba(30,41,59,0.04),0px_4px_6px_-1px_rgba(75,63,158,0.03)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(201,196,212,0.3)]">
              <div className="flex items-center gap-4">
                <span className="text-[#342586] text-[14px] font-bold">#RNG-2024-8622</span>
                <span className="text-[#787583] text-[12px]">•</span>
                <div className="flex items-center gap-1">
                  <img alt="" src={imgCalendar} className="w-[12px] h-[13px]" />
                  <span className="text-[#474552] text-[12px]">Diajukan: 15 Okt 2024</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-[#fee2e2] border border-[#fecdd3] rounded-full px-3 py-1">
                <img alt="" src={imgCross} className="w-[12.5px] h-[12.5px]" />
                <span className="text-[#991b1b] text-[11px] font-semibold tracking-[0.275px]">DITOLAK</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <img alt="" src={imgRoom} className="w-[13.5px] h-[13.5px]" />
                  <span className="text-[#787583] text-[12px] font-semibold line-through">Ruang Seminar Utama F-201</span>
                </div>
                <h3 className="text-[#111c2d] text-[20px] font-semibold leading-[28px]">Rapat Kerja Anggota Himpunan</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                  <div className="flex items-center gap-2"><img alt="" src={imgClock} className="w-[15px] h-[15px]" /><span className="text-[#474552] text-[12px]">Senin, 21 Okt 2024 | 13:00 - 17:00 WIB</span></div>
                  <div className="flex items-center gap-2"><img alt="" src={imgPerson} className="w-[12px] h-[12px]" /><span className="text-[#474552] text-[12px]">Peserta: 50 Orang</span></div>
                </div>
              </div>
              <div className="lg:col-span-5 bg-[rgba(254,226,226,0.4)] border border-[#fecdd3] rounded-[12px] p-4 flex items-start gap-2">
                <img alt="" src={imgRejectedIcon} className="w-[18.333px] h-[20.333px] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-[#991b1b] text-[12px] font-bold uppercase tracking-wide">ALASAN PENOLAKAN PETUGAS</span>
                  <p className="text-[#991b1b] text-[14px] leading-[22.75px]">"Ruangan sudah dialokasikan untuk Ujian Sidang Skripsi Pascasarjana. Silakan ajukan alternatif di Ruang B-204."</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[rgba(201,196,212,0.2)]">
              <button className="flex items-center gap-1.5 border border-[#c9c4d4] px-4 py-2 rounded-[8px] text-[#474552] text-[14px] font-semibold hover:bg-[#f5f6fa] transition-colors">
                <img alt="" src={imgNote} className="w-[15px] h-[15px]" />Detail Catatan
              </button>
              <button className="flex items-center gap-1.5 bg-[#ece9fe] border border-transparent px-6 py-2 rounded-[8px] text-[#4b3f9e] text-[14px] font-semibold hover:bg-[#d8e3fb] transition-colors">
                <img alt="" src={imgReapply} className="w-[15px] h-[13.5px]" />Ajukan Ruang Lain
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <span className="text-[#474552] text-[12px]">
          Menampilkan <span className="text-[#111c2d] font-medium">3</span> dari <span className="text-[#111c2d] font-medium">5</span> total pengajuan aktif
        </span>
        <div className="flex items-center gap-1">
          <button className="flex items-center justify-center w-8 h-8 border border-[rgba(201,196,212,0.6)] rounded-[8px] opacity-40 cursor-not-allowed">
            <img alt="" src={imgChevLeft} className="w-[5.55px] h-[9px]" />
          </button>
          <button className="flex items-center justify-center w-8 h-8 bg-[#4b3f9e] rounded-[8px] text-white text-[12px] font-semibold">1</button>
          <button className="flex items-center justify-center w-8 h-8 rounded-[8px] text-[#111c2d] text-[12px] font-semibold hover:bg-[#f5f6fa]">2</button>
          <button className="flex items-center justify-center w-8 h-8 border border-[rgba(201,196,212,0.6)] rounded-[8px] hover:bg-[#f5f6fa]">
            <img alt="" src={imgChevRight} className="w-[5.55px] h-[9px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
