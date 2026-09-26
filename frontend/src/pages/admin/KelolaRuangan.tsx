import { useState } from 'react';
import { api, useLiveQuery } from '../../api/client';
import type { RoomItem } from '../../api/client';

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  tersedia: { bg: '#d1fae5', text: '#065f46', label: 'Tersedia' },
  terpakai: { bg: '#fef3c7', text: '#92400e', label: 'Terpakai' },
  maintenance: { bg: '#fee2e2', text: '#991b1b', label: 'Maintenance' },
};

export default function KelolaRuangan() {
  const { data: allRooms, loading, refetch } = useLiveQuery(() => api.rooms.getAll());
  const rooms = Array.isArray(allRooms) ? allRooms : [];

  const [search, setSearch] = useState('');
  const [editRoom, setEditRoom] = useState<RoomItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', gedung: '', kapasitas: '', fasilitas: '', status: 'tersedia' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = rooms.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.gedung.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (room: RoomItem) => {
    try {
      await api.rooms.toggleStatus(room.id);
      await refetch();
    } catch (err) {
      alert('Gagal mengubah status: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleAdd = async () => {
    if (!newRoom.name || !newRoom.gedung || !newRoom.kapasitas) return;
    setIsSubmitting(true);
    try {
      await api.rooms.create({
        name: newRoom.name,
        gedung: newRoom.gedung,
        kapasitas: parseInt(newRoom.kapasitas),
        fasilitas: newRoom.fasilitas.split(',').map(f => f.trim()).filter(Boolean),
        status: newRoom.status,
      });
      await refetch();
      setShowAdd(false);
      setNewRoom({ name: '', gedung: '', kapasitas: '', fasilitas: '', status: 'tersedia' });
    } catch (err) {
      alert('Gagal menambah ruangan: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editRoom) return;
    setIsSubmitting(true);
    try {
      await api.rooms.update(editRoom.id, {
        name: editRoom.name,
        gedung: editRoom.gedung,
        kapasitas: editRoom.kapasitas,
        fasilitas: editRoom.fasilitas,
        status: editRoom.status,
      });
      await refetch();
      setEditRoom(null);
    } catch (err) {
      alert('Gagal memperbarui ruangan: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus ruangan ini dari sistem?')) return;
    try {
      await api.rooms.delete(id);
      await refetch();
    } catch (err) {
      alert('Gagal menghapus ruangan: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Kelola Ruangan</h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
          </div>
          <p className="text-[#474552] text-[14px]">Tambah, edit, dan kelola ketersediaan semua ruangan kampus langsung dari database.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="shrink-0 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
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
          { label: 'Maintenance / Terpakai', value: rooms.filter(r => r.status !== 'tersedia').length, color: '#991b1b' },
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

      {/* Table */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] overflow-hidden">
        {loading && rooms.length === 0 ? (
          <div className="p-12 text-center text-[#787583] text-[14px]">Memuat data ruangan...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8f9fc] border-b border-[rgba(201,196,212,0.4)] text-[#787583] font-semibold text-[11px] uppercase tracking-[0.5px]">
                <tr>
                  <th className="px-5 py-3.5">Nama Ruangan</th>
                  <th className="px-5 py-3.5">Gedung</th>
                  <th className="px-5 py-3.5">Kapasitas</th>
                  <th className="px-5 py-3.5">Fasilitas</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Peminjaman</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(201,196,212,0.3)] text-[#111c2d]">
                {filtered.map(r => {
                  const s = statusStyle[r.status] || { bg: '#f0f1f5', text: '#787583', label: r.status };
                  return (
                    <tr key={r.id} className="hover:bg-[#fcfcff] transition-colors">
                      <td className="px-5 py-4 font-semibold text-[#111c2d] whitespace-nowrap">{r.name}</td>
                      <td className="px-5 py-4 text-[#474552] whitespace-nowrap">{r.gedung}</td>
                      <td className="px-5 py-4 text-[#474552] whitespace-nowrap">{r.kapasitas} orang</td>
                      <td className="px-5 py-4 text-[#787583] max-w-[220px]">
                        <span className="line-clamp-1">{r.fasilitas ? r.fasilitas.join(', ') : '-'}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(r)}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: s.bg, color: s.text }}
                          title="Klik untuk ubah status ketersediaan"
                        >
                          {s.label} ↻
                        </button>
                      </td>
                      <td className="px-5 py-4 text-[#474552] whitespace-nowrap">{r.peminjamans_count ?? r.peminjaman_count} kali</td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditRoom(r)}
                            className="text-[#4b3f9e] hover:underline text-[12px] font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-[#ba1a1a] hover:underline text-[12px] font-semibold cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[16px] max-w-[460px] w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-[#111c2d] text-[18px] font-bold">Tambah Ruangan Baru</h3>
            <div className="flex flex-col gap-3 text-[13px]">
              <div>
                <label className="font-semibold text-[#111c2d] block mb-1">Nama Ruangan</label>
                <input
                  value={newRoom.name}
                  onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))}
                  placeholder="contoh: Auditorium Gedung B Lt. 2"
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#111c2d] block mb-1">Gedung / Lokasi</label>
                <input
                  value={newRoom.gedung}
                  onChange={e => setNewRoom(p => ({ ...p, gedung: e.target.value }))}
                  placeholder="contoh: Gedung Rektorat"
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#111c2d] block mb-1">Kapasitas (Orang)</label>
                <input
                  type="number"
                  value={newRoom.kapasitas}
                  onChange={e => setNewRoom(p => ({ ...p, kapasitas: e.target.value }))}
                  placeholder="contoh: 150"
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#111c2d] block mb-1">Fasilitas (pisahkan dengan koma)</label>
                <input
                  value={newRoom.fasilitas}
                  onChange={e => setNewRoom(p => ({ ...p, fasilitas: e.target.value }))}
                  placeholder="Proyektor, Sound System, AC"
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(201,196,212,0.3)]">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-[8px] text-[13px] font-semibold text-[#474552] hover:bg-[#f5f6fa] cursor-pointer">Batal</button>
              <button
                onClick={handleAdd}
                disabled={isSubmitting || !newRoom.name || !newRoom.gedung || !newRoom.kapasitas}
                className="px-4 py-2 bg-[#4b3f9e] hover:bg-[#342586] text-white rounded-[8px] text-[13px] font-semibold cursor-pointer disabled:opacity-50"
              >
                Simpan Ruangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[16px] max-w-[460px] w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-[#111c2d] text-[18px] font-bold">Edit Ruangan</h3>
            <div className="flex flex-col gap-3 text-[13px]">
              <div>
                <label className="font-semibold text-[#111c2d] block mb-1">Nama Ruangan</label>
                <input
                  value={editRoom.name}
                  onChange={e => setEditRoom(p => p ? { ...p, name: e.target.value } : null)}
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#111c2d] block mb-1">Gedung</label>
                <input
                  value={editRoom.gedung}
                  onChange={e => setEditRoom(p => p ? { ...p, gedung: e.target.value } : null)}
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#111c2d] block mb-1">Kapasitas</label>
                <input
                  type="number"
                  value={editRoom.kapasitas}
                  onChange={e => setEditRoom(p => p ? { ...p, kapasitas: parseInt(e.target.value) || 0 } : null)}
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#111c2d] block mb-1">Fasilitas (koma)</label>
                <input
                  value={editRoom.fasilitas ? editRoom.fasilitas.join(', ') : ''}
                  onChange={e => setEditRoom(p => p ? { ...p, fasilitas: e.target.value.split(',').map(f => f.trim()).filter(Boolean) } : null)}
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#111c2d] block mb-1">Status Ketersediaan</label>
                <select
                  value={editRoom.status}
                  onChange={e => setEditRoom(p => p ? { ...p, status: e.target.value as RoomItem['status'] } : null)}
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e]"
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="terpakai">Terpakai</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(201,196,212,0.3)]">
              <button onClick={() => setEditRoom(null)} className="px-4 py-2 border rounded-[8px] text-[13px] font-semibold text-[#474552] hover:bg-[#f5f6fa] cursor-pointer">Batal</button>
              <button
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#4b3f9e] hover:bg-[#342586] text-white rounded-[8px] text-[13px] font-semibold cursor-pointer disabled:opacity-50"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
