import { useState } from 'react';

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAY_NAMES = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

const allEvents: Record<string, { id: string; title: string; room: string; time: string; requester: string; status: string }[]> = {
  '2024-10-21': [
    { id: '#RNG-2024-8622', title: 'Rapat Kerja Anggota Himpunan', room: 'Ruang Seminar F-201', time: '13:00–17:00', requester: 'Rizky Dharma', status: 'ditolak' },
  ],
  '2024-10-25': [
    { id: '#RNG-2024-8841', title: 'Seminar Nasional Teknologi AI', room: 'Auditorium Rektorat Lt. 3', time: '08:00–12:30', requester: 'Rizky Dharma', status: 'menunggu' },
    { id: '#RNG-2024-8920', title: 'Kuliah Tamu Teknik Sipil', room: 'Aula Gedung A', time: '13:00–15:00', requester: 'Himpunan Teknik Sipil', status: 'disetujui' },
  ],
  '2024-10-26': [
    { id: '#RNG-2024-8710', title: 'Pelatihan UI/UX Sprint', room: 'Lab Multimedia Fasilkom', time: '09:00–15:00', requester: 'Rizky Dharma', status: 'disetujui' },
  ],
  '2024-10-28': [
    { id: '#RNG-2024-8902', title: 'Workshop Robotik Nasional', room: 'Aula Gedung A', time: '09:00–17:00', requester: 'Himpunan Teknik Elektro', status: 'menunggu' },
  ],
  '2024-10-30': [
    { id: '#RNG-2024-8930', title: 'Latihan Debat Mahasiswa', room: 'Ruang Seminar C-205', time: '15:00–17:00', requester: 'UKM Debat', status: 'disetujui' },
  ],
};

const statusColor: Record<string, string> = {
  disetujui: '#4b3f9e',
  menunggu: '#b45309',
  ditolak: '#991b1b',
};

export default function AdminJadwal() {
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(9);
  const [selectedDate, setSelectedDate] = useState<string | null>('2024-10-25');

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const dateKey = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const selectedEvents = selectedDate ? (allEvents[selectedDate] ?? []) : [];

  const totalToday = selectedEvents.length;
  const pending = selectedEvents.filter(e => e.status === 'menunggu').length;

  return (
    <div className="px-6 lg:px-8 py-6 max-w-[1040px] flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Jadwal Ruangan</h1>
        <p className="text-[#474552] text-[14px]">Pantau semua jadwal peminjaman ruang kampus secara keseluruhan.</p>
      </div>

      {selectedDate && totalToday > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-[#ece9fe] text-[#4b3f9e] text-[13px] font-semibold px-4 py-2 rounded-[8px]">
            📅 {selectedDate.split('-').reverse().join('/')}: <strong>{totalToday}</strong> kegiatan terjadwal
          </div>
          {pending > 0 && (
            <div className="bg-[#fef3c7] text-[#92400e] text-[13px] font-semibold px-4 py-2 rounded-[8px]">
              ⏳ {pending} menunggu verifikasi
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-7 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f5f6fa]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[#111c2d] text-[15px] font-semibold">{MONTH_NAMES[month]} {year}</span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f5f6fa]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES.map(d => <div key={d} className="text-center text-[11px] font-semibold text-[#787583] py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = dateKey(day);
                const evs = allEvents[key] ?? [];
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
                    {evs.length > 0 && !isSelected && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {evs.slice(0, 3).map((e, idx) => (
                          <span key={idx} className="w-1 h-1 rounded-full" style={{ backgroundColor: statusColor[e.status] }} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-5 py-3 border-t border-[rgba(201,196,212,0.3)] flex items-center gap-4 flex-wrap">
            {[{ color: '#4b3f9e', label: 'Disetujui' }, { color: '#b45309', label: 'Menunggu' }, { color: '#991b1b', label: 'Ditolak' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[11px] text-[#787583]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events detail */}
        <div className="lg:col-span-5 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col">
          <div className="px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">
              {selectedDate ? `Kegiatan – ${selectedDate.split('-').reverse().join('/')}` : 'Pilih tanggal'}
            </h3>
          </div>
          <div className="flex-1 px-5 py-4 flex flex-col gap-3 overflow-y-auto">
            {!selectedDate && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9c4d4" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="text-[#787583] text-[13px]">Klik tanggal untuk melihat kegiatan.</p>
              </div>
            )}
            {selectedDate && selectedEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <p className="text-[#787583] text-[13px]">Tidak ada kegiatan pada tanggal ini.</p>
              </div>
            )}
            {selectedEvents.map(ev => (
              <div key={ev.id} className="flex flex-col gap-2 bg-[#f8f9fc] border border-[rgba(201,196,212,0.4)] rounded-[10px] p-4">
                <div className="flex items-start gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: statusColor[ev.status] }} />
                  <span className="text-[#111c2d] text-[13px] font-semibold leading-snug">{ev.title}</span>
                </div>
                <div className="flex flex-col gap-1 pl-4">
                  <span className="text-[#342586] text-[11px] font-bold">{ev.id}</span>
                  <span className="text-[#787583] text-[11px]">📍 {ev.room}</span>
                  <span className="text-[#787583] text-[11px]">⏰ {ev.time} WIB</span>
                  <span className="text-[#787583] text-[11px]">👤 {ev.requester}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
