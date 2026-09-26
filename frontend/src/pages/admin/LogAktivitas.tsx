import { useState, useRef } from 'react';
import { api } from '../../api/client';
import { useLiveQuery } from '../../api/client';

const ACTION_LABELS: Record<string, string> = {
  pengajuan_baru: 'Pengajuan Baru',
  disetujui: 'Setujui Pengajuan',
  ditolak: 'Tolak Pengajuan',
  cancel: 'Batalkan Pengajuan',
  create_room: 'Tambah Ruangan',
  update_room: 'Update Ruangan',
  delete_room: 'Hapus Ruangan',
};

const ACTION_STYLE: Record<string, { bg: string; text: string }> = {
  pengajuan_baru: { bg: '#e0e7ff', text: '#3730a3' },
  disetujui: { bg: '#d1fae5', text: '#065f46' },
  ditolak:   { bg: '#fee2e2', text: '#991b1b' },
  cancel:    { bg: '#fef3c7', text: '#92400e' },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu · ${new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

type LogItem = {
  id: number;
  action: string;
  description: string;
  admin_name: string;
  created_at: string;
  meta: Record<string, unknown> | null;
};

export default function LogAktivitas() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const { data: rawLogs, loading } = useLiveQuery<LogItem[]>(
    () => api.activityLogs.getAll(debouncedSearch, filterAction),
    [debouncedSearch, filterAction],
    30000
  );
  const logs = Array.isArray(rawLogs) ? rawLogs : [];

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[#111c2d] text-[22px] font-bold tracking-[-0.4px]">Log Aktivitas</h1>
          <p className="text-[#787583] text-[13px] mt-1">Rekam jejak semua aksi admin di sistem</p>
        </div>
        <span className="text-[#787583] text-[12px] bg-[#f5f6fa] px-3 py-1.5 rounded-full border border-[rgba(201,196,212,0.5)]">
          {(logs ?? []).length} entri
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari deskripsi atau admin..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="h-[38px] flex-1 min-w-[200px] px-4 rounded-[10px] border border-[rgba(201,196,212,0.6)] text-[13px] outline-none focus:border-[#b45309] bg-white text-[#111c2d] placeholder-[#787583]"
        />
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="h-[38px] px-3 rounded-[10px] border border-[rgba(201,196,212,0.6)] text-[13px] outline-none focus:border-[#b45309] bg-white text-[#111c2d]"
        >
          <option value="">Semua Aksi</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] overflow-hidden">
        {loading && (logs ?? []).length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-[#b45309] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (logs ?? []).length === 0 ? (
          <div className="p-12 text-center text-[#787583] text-[14px]">
            <div className="text-4xl mb-3">📄</div>
            Belum ada log aktivitas.
          </div>
        ) : (
          <div className="divide-y divide-[rgba(201,196,212,0.3)]">
            {(logs ?? []).map(log => {
              const style = ACTION_STYLE[log.action] || { bg: '#f0f1f5', text: '#474552' };
              const label = ACTION_LABELS[log.action] || log.action;
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[#fafafc] transition-colors">
                  {/* Action badge */}
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: style.bg, color: style.text }}
                  >
                    {label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#111c2d] text-[13px]">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#4b3f9e] text-[11px] font-semibold">{log.admin_name}</span>
                      <span className="text-[#c9c4d4]">·</span>
                      <span className="text-[#787583] text-[11px]">{timeAgo(log.created_at)}</span>
                    </div>
                    {Boolean(log.meta?.ticket_number) && (
                      <span className="text-[#787583] text-[10px] font-mono mt-1 block">{String(log.meta?.ticket_number)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
