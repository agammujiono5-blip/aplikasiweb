import { useState } from 'react';

interface User {
  id: string;
  nama: string;
  nim: string;
  email: string;
  prodi: string;
  angkatan: string;
  status: 'aktif' | 'nonaktif';
  pengajuan: number;
  disetujui: number;
}

const initialUsers: User[] = [
  { id: 'u1', nama: 'Rizky Dharma Pratama', nim: '2021001234', email: 'rizky.dharma@mhs.nusantara.ac.id', prodi: 'Teknik Informatika', angkatan: '2021', status: 'aktif', pengajuan: 5, disetujui: 2 },
  { id: 'u2', nama: 'Siti Nurhaliza', nim: '2020005678', email: 'siti.nurhaliza@mhs.nusantara.ac.id', prodi: 'Teknik Elektro', angkatan: '2020', status: 'aktif', pengajuan: 3, disetujui: 3 },
  { id: 'u3', nama: 'Ahmad Fauzi', nim: '2022009012', email: 'ahmad.fauzi@mhs.nusantara.ac.id', prodi: 'Manajemen', angkatan: '2022', status: 'aktif', pengajuan: 4, disetujui: 2 },
  { id: 'u4', nama: 'Dewi Rahayu', nim: '2021003456', email: 'dewi.rahayu@mhs.nusantara.ac.id', prodi: 'Akuntansi', angkatan: '2021', status: 'aktif', pengajuan: 2, disetujui: 2 },
  { id: 'u5', nama: 'Budi Santoso', nim: '2019007890', email: 'budi.santoso@mhs.nusantara.ac.id', prodi: 'Hukum', angkatan: '2019', status: 'nonaktif', pengajuan: 8, disetujui: 5 },
  { id: 'u6', nama: 'Maya Putri', nim: '2022011234', email: 'maya.putri@mhs.nusantara.ac.id', prodi: 'Psikologi', angkatan: '2022', status: 'aktif', pengajuan: 1, disetujui: 1 },
];

export default function DataPengguna() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');
  const [selected, setSelected] = useState<User | null>(null);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.nama.toLowerCase().includes(search.toLowerCase()) || u.nim.includes(search) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'semua' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'aktif' ? 'nonaktif' : 'aktif' } : u));
    if (selected?.id === userId) setSelected(prev => prev ? { ...prev, status: prev.status === 'aktif' ? 'nonaktif' : 'aktif' } : null);
  };

  return (
    <div className="px-6 lg:px-8 py-6 max-w-[1040px] flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Data Pengguna</h1>
        <p className="text-[#474552] text-[14px]">Kelola akun mahasiswa yang terdaftar dalam sistem peminjaman.</p>
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

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(['semua', 'aktif', 'nonaktif'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors capitalize
                ${filterStatus === f ? 'bg-[#4b3f9e] text-white' : 'bg-white border border-[rgba(201,196,212,0.7)] text-[#474552] hover:bg-[#f5f6fa]'}`}
            >
              {f === 'semua' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787583]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, NIM, atau email..."
            className="w-full h-[40px] bg-white border border-[rgba(201,196,212,0.7)] rounded-[8px] pl-9 pr-4 text-[13px] text-[#111c2d] placeholder-[#787583] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(201,196,212,0.3)] bg-[#f8f9fc]">
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide">Pengguna</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide hidden sm:table-cell">Program Studi</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide hidden lg:table-cell">Pengajuan</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#787583] uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,196,212,0.2)]">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-[#f8f9fc] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#ece9fe] flex items-center justify-center text-[#4b3f9e] text-[12px] font-bold shrink-0">
                        {user.nama.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#111c2d] text-[13px] font-semibold">{user.nama}</span>
                        <span className="text-[#787583] text-[11px]">{user.nim} · Angkatan {user.angkatan}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-[#474552] text-[13px]">{user.prodi}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#111c2d] text-[13px] font-medium">{user.pengajuan} total</span>
                      <span className="text-[#065f46] text-[11px]">{user.disetujui} disetujui</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: user.status === 'aktif' ? '#d1fae5' : '#f0f1f5',
                        color: user.status === 'aktif' ? '#065f46' : '#787583',
                      }}
                    >
                      {user.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(user)}
                        className="text-[#4b3f9e] text-[12px] font-semibold hover:underline"
                      >
                        Detail
                      </button>
                      <span className="text-[#c9c4d4]">|</span>
                      <button
                        onClick={() => toggleStatus(user.id)}
                        className={`text-[12px] font-semibold hover:underline ${user.status === 'aktif' ? 'text-[#991b1b]' : 'text-[#065f46]'}`}
                      >
                        {user.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[#787583] text-[13px]">Tidak ada pengguna yang cocok.</div>
          )}
        </div>
      </div>

      {/* User detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/30" onClick={() => setSelected(null)} />
          <div className="w-full max-w-[400px] bg-white h-full overflow-y-auto flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(201,196,212,0.3)] sticky top-0 bg-white z-10">
              <h3 className="text-[#111c2d] text-[16px] font-bold">Detail Pengguna</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-[#f5f6fa] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-6 py-6 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#ece9fe] flex items-center justify-center text-[#4b3f9e] text-[22px] font-bold">
                  {selected.nama.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h4 className="text-[#111c2d] text-[16px] font-bold">{selected.nama}</h4>
                  <p className="text-[#787583] text-[13px]">{selected.nim}</p>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${selected.status === 'aktif' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f0f1f5] text-[#787583]'}`}>
                    {selected.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              {[
                { label: 'Email', value: selected.email },
                { label: 'Program Studi', value: selected.prodi },
                { label: 'Angkatan', value: selected.angkatan },
                { label: 'Total Pengajuan', value: `${selected.pengajuan} pengajuan` },
                { label: 'Pengajuan Disetujui', value: `${selected.disetujui} disetujui` },
              ].map(row => (
                <div key={row.label} className="flex flex-col gap-1 border-b border-[rgba(201,196,212,0.2)] pb-3 last:border-0">
                  <span className="text-[#787583] text-[11px] font-semibold uppercase tracking-wide">{row.label}</span>
                  <span className="text-[#111c2d] text-[14px]">{row.value}</span>
                </div>
              ))}

              <button
                onClick={() => toggleStatus(selected.id)}
                className={`w-full py-3 rounded-[10px] text-[14px] font-semibold transition-colors ${
                  selected.status === 'aktif'
                    ? 'bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecdd3]'
                    : 'bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]'
                }`}
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
