import { useState } from 'react';
import { api, useLiveQuery } from '../../api/client';
import type { UserAdminItem } from '../../api/client';

export default function DataPengguna() {
  const { data: allUsers, loading, refetch } = useLiveQuery(() => api.users.getAdminList());
  const users = Array.isArray(allUsers) ? allUsers : [];

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');
  const [selected, setSelected] = useState<UserAdminItem | null>(null);

  const filtered = users.filter(u => {
    const matchSearch =
      !search ||
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.nim.includes(search) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.prodi.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'semua' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleStatus = async (userId: string) => {
    try {
      await api.users.toggleStatus(userId);
      await refetch();
      if (selected?.id === userId) {
        setSelected(prev => prev ? { ...prev, status: prev.status === 'aktif' ? 'nonaktif' : 'aktif' } : null);
      }
    } catch (err) {
      alert('Gagal mengubah status pengguna: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Data Pengguna</h1>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
        </div>
        <p className="text-[#474552] text-[14px]">Kelola akun mahasiswa yang terdaftar dalam sistem peminjaman secara real-time.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Pengguna', value: users.length, color: '#4b3f9e' },
          { label: 'Akun Aktif', value: users.filter(u => u.status === 'aktif').length, color: '#065f46' },
          { label: 'Akun Nonaktif', value: users.filter(u => u.status === 'nonaktif').length, color: '#991b1b' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-col gap-1 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
            <span className="text-[#787583] text-[12px]">{s.label}</span>
            <span className="text-[24px] font-bold" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-4 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
        <div className="flex items-center gap-1">
          {(['semua', 'aktif', 'nonaktif'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors capitalize cursor-pointer
                ${filterStatus === st ? 'bg-[#ece9fe] text-[#4b3f9e]' : 'text-[#474552] hover:bg-[#f5f6fa]'}`}
            >
              {st} ({st === 'semua' ? users.length : users.filter(u => u.status === st).length})
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
            placeholder="Cari nama, NIM, email, prodi..."
            className="w-full h-[40px] bg-white border border-[rgba(201,196,212,0.7)] rounded-[8px] pl-9 pr-4 text-[13px] text-[#111c2d] placeholder-[#787583] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-12 text-center text-[#787583] text-[14px]">Memuat data pengguna dari database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8f9fc] border-b border-[rgba(201,196,212,0.4)] text-[#787583] font-semibold text-[11px] uppercase tracking-[0.5px]">
                <tr>
                  <th className="px-5 py-3.5">Mahasiswa</th>
                  <th className="px-5 py-3.5">NIM</th>
                  <th className="px-5 py-3.5">Program Studi</th>
                  <th className="px-5 py-3.5">Status Akun</th>
                  <th className="px-5 py-3.5">Pengajuan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(201,196,212,0.3)] text-[#111c2d]">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-[#fcfcff] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#111c2d]">{u.nama}</span>
                        <span className="text-[#787583] text-[11px]">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-[#474552] whitespace-nowrap">{u.nim}</td>
                    <td className="px-5 py-4 text-[#474552] whitespace-nowrap">{u.prodi}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(u.id)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity
                          ${u.status === 'aktif' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'}`}
                        title="Klik untuk ubah status akun"
                      >
                        {u.status === 'aktif' ? 'Aktif' : 'Nonaktif'} ↻
                      </button>
                    </td>
                    <td className="px-5 py-4 text-[#474552] whitespace-nowrap">
                      <span className="font-semibold text-[#111c2d]">{u.pengajuan}</span> total · <span className="text-[#065f46] font-semibold">{u.disetujui}</span> disetujui
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelected(u)}
                          className="text-[#4b3f9e] hover:underline text-[12px] font-semibold cursor-pointer"
                        >
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[16px] max-w-[460px] w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[#111c2d] text-[18px] font-bold">{selected.nama}</h3>
                <span className="text-[#787583] text-[12px] font-mono">{selected.nim}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#787583] hover:text-[#111c2d] text-[20px] font-bold cursor-pointer">×</button>
            </div>
            <div className="flex flex-col gap-2.5 text-[13px] bg-[#f8f9fc] p-4 rounded-[10px] border border-[rgba(201,196,212,0.3)]">
              <div><span className="text-[#787583]">Email:</span> <p className="font-semibold text-[#111c2d]">{selected.email}</p></div>
              <div><span className="text-[#787583]">Program Studi:</span> <p className="font-semibold text-[#111c2d]">{selected.prodi}</p></div>
              <div><span className="text-[#787583]">Fakultas:</span> <p className="font-semibold text-[#111c2d]">{selected.fakultas}</p></div>
              <div><span className="text-[#787583]">Angkatan:</span> <p className="font-semibold text-[#111c2d]">{selected.angkatan}</p></div>
              <div><span className="text-[#787583]">Status Akun:</span>
                <span className={`inline-block ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${selected.status === 'aktif' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                  {selected.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <div><span className="text-[#787583]">Total Pengajuan:</span> <p className="font-semibold text-[#111c2d]">{selected.pengajuan} kali ({selected.disetujui} disetujui)</p></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(201,196,212,0.3)]">
              <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded-[8px] text-[13px] font-semibold text-[#474552] hover:bg-[#f5f6fa] cursor-pointer">Tutup</button>
              <button
                onClick={() => toggleStatus(selected.id)}
                className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white cursor-pointer ${selected.status === 'aktif' ? 'bg-[#ba1a1a] hover:bg-[#931515]' : 'bg-[#065f46] hover:bg-[#044e39]'}`}
              >
                {selected.status === 'aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
