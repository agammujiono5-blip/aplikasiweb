import { useState } from 'react';
import { api, useLiveQuery } from '../../api/client';

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAY_NAMES = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

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
  const [month, setMonth] = useState(9); // Oct default
  const [selectedDate, setSelectedDate] = useState<string | null>('2024-10-25');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');

  // Live real-time polling
  const { data: combinedData } = useLiveQuery(async () => {
    const [rooms, events] = await Promise.all([
      api.rooms.getAll(),
      api.jadwal.get(selectedRoomId),
    ]);
    return { rooms, events };
  }, [selectedRoomId]);

  const rooms = combinedData?.rooms || [];
  const events = combinedData?.events || {};

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

  const dateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedEvents = selectedDate ? (events[selectedDate] ?? []) : [];

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Jadwal Ketersediaan Ruangan</h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
          </div>
          <p className="text-[#474552] text-[14px]">Cek ketersediaan dan jadwal peminjaman ruangan kampus sebelum mengajukan.</p>
        </div>
        <button
          onClick={() => onNavigate('ajukan')}
          className="shrink-0 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          + Ajukan Ruang Ini
        </button>
      </div>

      {/* Filter Room */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-[#111c2d]">Filter Ruangan:</span>
          <select
            value={selectedRoomId}
            onChange={e => setSelectedRoomId(e.target.value)}
            className="border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-1.5 text-[13px] outline-none focus:border-[#4b3f9e] bg-white cursor-pointer"
          >
            <option value="all">Semua Ruangan</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.gedung})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4 text-[12px]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4b3f9e]" /> Disetujui</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#b45309]" /> Menunggu Verifikasi</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-7 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f5f6fa] cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[#111c2d] text-[15px] font-semibold">{MONTH_NAMES[month]} {year}</span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f5f6fa] cursor-pointer">
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
              {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = dateKey(day);
                const dayEvents = events[key] ?? [];
                const isSelected = selectedDate === key;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-[8px] text-[13px] font-medium transition-all relative cursor-pointer
                      ${isSelected ? 'bg-[#4b3f9e] text-white shadow-sm' : 'hover:bg-[#f5f6fa] text-[#111c2d]'}`}
                  >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((e, idx) => (
                          <div
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isSelected ? 'white' : (statusColor[e.status] || '#4b3f9e') }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected date events */}
        <div className="lg:col-span-5 bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(201,196,212,0.3)]">
            <h3 className="text-[#111c2d] text-[15px] font-semibold">
              {selectedDate ? `Jadwal ${selectedDate.split('-').reverse().join('/')}` : 'Pilih Tanggal'}
            </h3>
            <span className="text-[#787583] text-[12px]">{selectedEvents.length} kegiatan</span>
          </div>
          <div className="flex flex-col p-4 gap-3 overflow-y-auto max-h-[380px]">
            {selectedEvents.length === 0 ? (
              <div className="py-12 text-center text-[#787583] text-[13px]">
                {selectedDate ? 'Ruangan tersedia (tidak ada kegiatan terjadwal).' : 'Pilih tanggal pada kalender untuk melihat status.'}
              </div>
            ) : (
              selectedEvents.map(e => (
                <div key={e.id} className="p-3.5 rounded-[10px] bg-[#f8f9fc] border border-[rgba(201,196,212,0.4)] flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#111c2d] text-[13px] font-semibold leading-snug">{e.title}</span>
                    <span
                      className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                      style={{
                        backgroundColor: e.status === 'disetujui' ? '#d1fae5' : '#fef3c7',
                        color: e.status === 'disetujui' ? '#065f46' : '#92400e',
                      }}
                    >
                      {e.status}
                    </span>
                  </div>
                  <div className="text-[#787583] text-[11px] flex flex-col gap-0.5">
                    <span>🏢 {e.room}</span>
                    <span>⏰ {e.time} WIB</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
