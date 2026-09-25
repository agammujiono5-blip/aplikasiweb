import { useState } from 'react';

const rooms = [
  'Semua Ruangan',
  'Aula Gedung A',
  'Lab Komputer B-101',
  'Ruang Seminar C-205',
  'Auditorium Rektorat Lt. 3',
  'Lab Multimedia Fasilkom',
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAY_NAMES = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const events: Record<string, { title: string; room: string; time: string; status: string }[]> = {
  '2024-10-21': [
    { title: 'Rapat Kerja Himpunan', room: 'Ruang Seminar C-205', time: '13:00–17:00', status: 'ditolak' },
  ],
  '2024-10-25': [
    { title: 'Seminar AI & Cloud 2024', room: 'Auditorium Rektorat Lt. 3', time: '08:00–12:30', status: 'menunggu' },
    { title: 'Kuliah Tamu Teknik', room: 'Aula Gedung A', time: '13:00–15:00', status: 'disetujui' },
  ],
  '2024-10-26': [
    { title: 'Pelatihan UI/UX Sprint', room: 'Lab Multimedia Fasilkom', time: '09:00–15:00', status: 'disetujui' },
  ],
  '2024-10-28': [
    { title: 'Seminar Kewirausahaan', room: 'Aula Gedung A', time: '09:00–12:00', status: 'disetujui' },
  ],
  '2024-10-30': [
    { title: 'Latihan Debat Mahasiswa', room: 'Ruang Seminar C-205', time: '15:00–17:00', status: 'disetujui' },
  ],
};

const statusColor: Record<string, string> = {
  disetujui: '#4b3f9e',
  menunggu: '#b45309',
  ditolak: '#991b1b',
};

interface JadwalProps {
  onNavigate: (page: string) => void;
}

export default function JadwalRuangan({ onNavigate }: JadwalProps) {
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(9); // Oct
  const [selectedDate, setSelectedDate] = useState<string | null>('2024-10-25');
  const [selectedRoom, setSelectedRoom] = useState('Semua Ruangan');

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const dateKey = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const selectedEvents = selectedDate ? (events[selectedDate] ?? []) : [];
  const filteredEvents = selectedRoom === 'Semua Ruangan'
    ? selectedEvents
    : selectedEvents.filter(e => e.room === selectedRoom);

  return (
    <div className="px-6 lg:px-8 py-6 max-w-[1040px] flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Jadwal Ruangan</h1>
          <p className="text-[#474552] text-[14px]">Lihat ketersediaan ruangan sebelum mengajukan peminjaman.</p>
        </div>
        <button
          onClick={() => onNavigate('ajukan')}
          className="shrink-0 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors"
        >
          + Ajukan
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {rooms.map(r => (
          <button
            key={r}
            onClick={() => setSelectedRoom(r)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all
              ${selectedRoom === r ? 'bg-[#4b3f9e] border-[#4b3f9e] text-white' : 'bg-white border-[rgba(201,196,212,0.7)] text-[#474552] hover:border-[#4b3f9e]'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-7 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f5f6fa] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[#111c2d] text-[15px] font-semibold">{MONTH_NAMES[month]} {year}</span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f5f6fa] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-[#787583] py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = dateKey(day);
                const hasEvents = !!events[key];
                const isSelected = selectedDate === key;
                const isToday = key === '2024-10-25';
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-[8px] text-[13px] font-medium transition-all relative
                      ${isSelected ? 'bg-[#4b3f9e] text-white' : isToday ? 'border-2 border-[#4b3f9e] text-[#4b3f9e]' : 'hover:bg-[#f5f6fa] text-[#111c2d]'}`}
                  >
                    {day}
                    {hasEvents && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#4b3f9e]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-[rgba(201,196,212,0.3)] flex items-center gap-4 flex-wrap">
            {[
              { color: '#4b3f9e', label: 'Disetujui' },
              { color: '#b45309', label: 'Menunggu' },
              { color: '#991b1b', label: 'Ditolak' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[11px] text-[#787583]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Event detail */}
        <div className="lg:col-span-5 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">
              {selectedDate
                ? `Kegiatan – ${selectedDate.split('-').reverse().join('/')}`
                : 'Pilih tanggal untuk melihat kegiatan'
              }
            </h3>
          </div>

          <div className="flex-1 px-5 py-4 flex flex-col gap-3">
            {!selectedDate && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8 text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9c4d4" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="text-[#787583] text-[13px]">Klik tanggal pada kalender untuk melihat kegiatan yang terjadwal.</p>
              </div>
            )}
            {selectedDate && filteredEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-[#f0f1f5] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#787583" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </div>
                <p className="text-[#787583] text-[13px]">Tidak ada kegiatan pada tanggal ini.</p>
                <button onClick={() => onNavigate('ajukan')} className="text-[#4b3f9e] text-[12px] font-semibold hover:underline">
                  Ajukan peminjaman →
                </button>
              </div>
            )}
            {filteredEvents.map((ev, i) => (
              <div key={i} className="flex flex-col gap-1.5 bg-[#f8f9fc] border border-[rgba(201,196,212,0.4)] rounded-[10px] p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#111c2d] text-[13px] font-semibold leading-snug">{ev.title}</span>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: statusColor[ev.status] }}
                  />
                </div>
                <div className="flex items-center gap-1 text-[#787583] text-[12px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="19" rx="2"/>
                  </svg>
                  {ev.room}
                </div>
                <div className="flex items-center gap-1 text-[#787583] text-[12px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {ev.time} WIB
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
