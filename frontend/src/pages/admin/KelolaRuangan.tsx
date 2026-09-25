import { useState } from 'react';

interface Room {
  id: string;
  name: string;
  gedung: string;
  kapasitas: number;
  fasilitas: string[];
  status: 'tersedia' | 'terpakai' | 'maintenance';
  peminjaman: number;
}

const initialRooms: Room[] = [
  { id: 'r1', name: 'Auditorium Rektorat Lt. 3', gedung: 'Gedung Rektorat', kapasitas: 500, fasilitas: ['Proyektor', 'Sound System', 'AC', 'Lighting', 'Podium'], status: 'terpakai', peminjaman: 13 },
  { id: 'r2', name: 'Aula Gedung A', gedung: 'Gedung A', kapasitas: 300, fasilitas: ['Proyektor', 'Sound System', 'AC', 'Podium'], status: 'tersedia', peminjaman: 11 },
  { id: 'r3', name: 'Lab Komputer B-101', gedung: 'Gedung B', kapasitas: 40, fasilitas: ['PC Workstation', 'AC', 'Proyektor'], status: 'tersedia', peminjaman: 5 },
  { id: 'r4', name: 'Ruang Seminar C-205', gedung: 'Gedung C', kapasitas: 80, fasilitas: ['Proyektor', 'Whiteboard', 'AC'], status: 'tersedia', peminjaman: 7 },
  { id: 'r5', name: 'Lab Multimedia Fasilkom', gedung: 'Gedung Fasilkom', kapasitas: 40, fasilitas: ['PC Workstation', 'AC'], status: 'terpakai', peminjaman: 10 },
  { id: 'r6', name: 'Ruang Rapat Dekanat', gedung: 'Gedung Rektorat', kapasitas: 20, fasilitas: ['TV LED', 'AC', 'Whiteboard'], status: 'maintenance', peminjaman: 3 },
];

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  tersedia: { bg: '#d1fae5', text: '#065f46', label: 'Tersedia' },
  terpakai: { bg: '#fef3c7', text: '#92400e', label: 'Terpakai' },
  maintenance: { bg: '#fee2e2', text: '#991b1b', label: 'Maintenance' },
};

export default function KelolaRuangan() {
  const [rooms, setRooms] = useState(initialRooms);
  const [search, setSearch] = useState('');
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', gedung: '', kapasitas: '', fasilitas: '' });

  const filtered = rooms.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.gedung.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (room: Room) => {
    const next: Record<string, Room['status']> = { tersedia: 'maintenance', maintenance: 'tersedia', terpakai: 'tersedia' };
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: next[r.status] } : r));
  };

  const handleAdd = () => {
    if (!newRoom.name || !newRoom.gedung || !newRoom.kapasitas) return;
    const r: Room = {
      id: `r${Date.now()}`,
      name: newRoom.name,
      gedung: newRoom.gedung,
      kapasitas: parseInt(newRoom.kapasitas),
      fasilitas: newRoom.fasilitas.split(',').map(f => f.trim()).filter(Boolean),
      status: 'tersedia',
      peminjaman: 0,
    };
    setRooms(prev => [...prev, r]);
    setShowAdd(false);
    setNewRoom({ name: '', gedung: '', kapasitas: '', fasilitas: '' });
  };

  return (
    <div className="px-6 lg:px-8 py-6 max-w-[1040px] flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Kelola Ruangan</h1>
          <p className="text-[#474552] text-[14px]">Tambah, edit, dan kelola ketersediaan semua ruangan kampus.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="shrink-0 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Ruangan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Ruangan', value: rooms.length, color: '#4b3f9e' },
          { label: 'Tersedia', value: rooms.filter(r => r.status === 'tersedia').length, color: '#065f46' },
          { label: 'Maintenance', value: rooms.filter(r => r.status === 'maintenance').length, color: '#991b1b' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-col gap-1 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
            <span className="text-[#787583] text-[12px]">{s.label}</span>
            <span className="text-[24px] font-bold" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-[320px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787583]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari ruangan atau gedung..."
          className="w-full h-[40px] bg-white border border-[rgba(201,196,212,0.7)] rounded-[8px] pl-9 pr-4 text-[13px] text-[#111c2d] placeholder-[#787583] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all"
        />
      </div>

      {/* Room cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(room => {
          const s = statusStyle[room.status];
          return (
            <div key={room.id} className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-5 shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[#111c2d] text-[14px] font-semibold leading-snug">{room.name}</h3>
                  <p className="text-[#787583] text-[12px]">{room.gedung}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
              </div>

              <div className="flex items-center gap-4 text-[12px] text-[#474552]">
                <div className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  {room.kapasitas} orang
                </div>
                <div className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  </svg>
                  {room.peminjaman} peminjaman
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {room.fasilitas.slice(0, 3).map(f => (
                  <span key={f} className="text-[10px] bg-[#f0f1f5] text-[#474552] px-2 py-0.5 rounded-full">{f}</span>
                ))}
                {room.fasilitas.length > 3 && (
                  <span className="text-[10px] bg-[#f0f1f5] text-[#787583] px-2 py-0.5 rounded-full">+{room.fasilitas.length - 3}</span>
                )}
              </div>

              <div className="flex gap-2 pt-1 border-t border-[rgba(201,196,212,0.3)]">
                <button
                  onClick={() => setEditRoom(room)}
                  className="flex-1 text-[#474552] text-[12px] font-semibold py-1.5 rounded-[6px] border border-[rgba(201,196,212,0.7)] hover:bg-[#f5f6fa] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleStatus(room)}
                  className="flex-1 text-[12px] font-semibold py-1.5 rounded-[6px] transition-colors"
                  style={{
                    backgroundColor: room.status === 'maintenance' ? '#d1fae5' : '#fef3c7',
                    color: room.status === 'maintenance' ? '#065f46' : '#92400e',
                  }}
                >
                  {room.status === 'maintenance' ? 'Aktifkan' : room.status === 'tersedia' ? 'Maintenance' : 'Tersediakan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-[16px] w-full max-w-[480px] p-6 flex flex-col gap-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[#111c2d] text-[18px] font-bold">Tambah Ruangan Baru</h3>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full bg-[#f5f6fa] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {[
              { key: 'name', label: 'Nama Ruangan', placeholder: 'Contoh: Ruang Seminar D-301' },
              { key: 'gedung', label: 'Gedung', placeholder: 'Contoh: Gedung D' },
              { key: 'kapasitas', label: 'Kapasitas (orang)', placeholder: '0', type: 'number' },
              { key: 'fasilitas', label: 'Fasilitas (pisahkan koma)', placeholder: 'Proyektor, AC, Whiteboard' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  placeholder={f.placeholder}
                  value={newRoom[f.key as keyof typeof newRoom]}
                  onChange={e => setNewRoom(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="h-[40px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 text-[13px] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-[rgba(201,196,212,0.7)] text-[#474552] text-[14px] font-semibold py-2.5 rounded-[8px] hover:bg-[#f5f6fa]">Batal</button>
              <button onClick={handleAdd} disabled={!newRoom.name || !newRoom.gedung || !newRoom.kapasitas} className="flex-1 bg-[#4b3f9e] hover:bg-[#342586] disabled:opacity-40 text-white text-[14px] font-semibold py-2.5 rounded-[8px] transition-colors">Tambah</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditRoom(null)} />
          <div className="relative bg-white rounded-[16px] w-full max-w-[480px] p-6 flex flex-col gap-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[#111c2d] text-[18px] font-bold">Edit Ruangan</h3>
              <button onClick={() => setEditRoom(null)} className="w-8 h-8 rounded-full bg-[#f5f6fa] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {[
              { key: 'name', label: 'Nama Ruangan' },
              { key: 'gedung', label: 'Gedung' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">{f.label}</label>
                <input
                  value={editRoom[f.key as keyof Room] as string}
                  onChange={e => setEditRoom(prev => prev ? { ...prev, [f.key]: e.target.value } : null)}
                  className="h-[40px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 text-[13px] outline-none focus:border-[#4b3f9e] transition-all bg-white"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditRoom(null)} className="flex-1 border border-[rgba(201,196,212,0.7)] text-[#474552] text-[14px] font-semibold py-2.5 rounded-[8px] hover:bg-[#f5f6fa]">Batal</button>
              <button
                onClick={() => {
                  setRooms(prev => prev.map(r => r.id === editRoom.id ? editRoom : r));
                  setEditRoom(null);
                }}
                className="flex-1 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[14px] font-semibold py-2.5 rounded-[8px] transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
