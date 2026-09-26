import { useState } from 'react';
import { api, useLiveQuery } from '../../api/client';
import type { PeminjamanItem } from '../../api/client';
import { showToast } from '../../utils/toast';

type Status = 'menunggu' | 'disetujui' | 'ditolak';

const statusStyle: Record<Status, { bg: string; border: string; text: string; label: string }> = {
  menunggu: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', label: 'Menunggu' },
  disetujui: { bg: '#d1fae5', border: '#a7f3d0', text: '#065f46', label: 'Disetujui' },
  ditolak: { bg: '#fee2e2', border: '#fecdd3', text: '#991b1b', label: 'Ditolak' },
};

export default function KelolaPengajuan() {
  const [activeTab, setActiveTab] = useState<'semua' | Status>('semua');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PeminjamanItem | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await api.export.downloadPeminjaman(
        activeTab !== 'semua' ? activeTab : undefined
      );
      showToast('Data berhasil diekspor ke CSV', 'success');
    } catch (e) {
      showToast('Gagal mengekspor: ' + (e instanceof Error ? e.message : String(e)), 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportError('');
    try {
      const res = await api.export.importPeminjaman(importFile);
      showToast(res.message || `Berhasil mengimpor ${res.imported_count} data`, 'success');
      setShowImportModal(false);
      setImportFile(null);
      await refetch();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : String(e));
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await api.export.downloadTemplateCsv();
      showToast('Template CSV berhasil diunduh', 'success');
    } catch (e) {
      showToast('Gagal mengunduh template: ' + (e instanceof Error ? e.message : String(e)), 'error');
    }
  };

  // Live real-time polling
  const { data: allPengajuan, loading, refetch } = useLiveQuery(
    () => api.peminjaman.getAdminList(),
    []
  );

  const data = Array.isArray(allPengajuan) ? allPengajuan : [];

  const tabs: { key: 'semua' | Status; label: string; count: number }[] = [
    { key: 'semua', label: 'Semua', count: data.length },
    { key: 'menunggu', label: 'Menunggu Verifikasi', count: data.filter(d => d.status === 'menunggu').length },
    { key: 'disetujui', label: 'Disetujui', count: data.filter(d => d.status === 'disetujui').length },
    { key: 'ditolak', label: 'Ditolak', count: data.filter(d => d.status === 'ditolak').length },
  ];

  const filtered = data.filter(d => {
    const matchTab = activeTab === 'semua' || d.status === activeTab;
    const matchSearch =
      !search ||
      d.nama_kegiatan.toLowerCase().includes(search.toLowerCase()) ||
      d.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      (d.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.room?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleApprove = async (item: PeminjamanItem) => {
    setIsSubmitting(true);
    try {
      await api.peminjaman.updateStatusAdmin(item.id, 'disetujui');
      await refetch();
      setSelected(null);
      setAction(null);
      showToast('Pengajuan berhasil disetujui', 'success');
    } catch (err) {
      showToast('Gagal menyetujui: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (item: PeminjamanItem) => {
    setIsSubmitting(true);
    try {
      await api.peminjaman.updateStatusAdmin(item.id, 'ditolak', rejectNote);
      await refetch();
      setSelected(null);
      setAction(null);
      setRejectNote('');
      showToast('Pengajuan berhasil ditolak', 'success');
    } catch (err) {
      showToast('Gagal menolak: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Kelola Pengajuan</h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1" title="Real-time live sync aktif" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowImportModal(true);
                setImportError('');
                setImportFile(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#ece9fe] text-[#4b3f9e] text-[13px] font-semibold hover:bg-[#dedaff] transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import CSV
            </button>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#fff3cd] text-[#b45309] text-[13px] font-semibold hover:bg-[#fde68a] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exportLoading ? 'Mengekspor...' : 'Export CSV'}
            </button>
          </div>
        </div>
        <p className="text-[#474552] text-[14px]">Tinjau, setujui, atau tolak pengajuan peminjaman ruang dari mahasiswa secara real-time.</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-4 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
        <div className="flex items-center gap-1 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer
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
            placeholder="Cari kegiatan, tiket, pemohon..."
            className="w-full h-[40px] bg-white border border-[rgba(201,196,212,0.7)] rounded-[8px] pl-9 pr-4 text-[13px] text-[#111c2d] placeholder-[#787583] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] shadow-[0px_1px_3px_rgba(30,41,59,0.04)] overflow-hidden">
        {loading && data.length === 0 ? (
          <div className="p-12 text-center text-[#787583] text-[14px]">Memuat data pengajuan dari database...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#787583] text-[14px]">Tidak ada pengajuan yang sesuai.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8f9fc] border-b border-[rgba(201,196,212,0.4)] text-[#787583] font-semibold text-[11px] uppercase tracking-[0.5px]">
                <tr>
                  <th className="px-5 py-3.5">No. Tiket</th>
                  <th className="px-5 py-3.5">Kegiatan & Pemohon</th>
                  <th className="px-5 py-3.5">Ruangan</th>
                  <th className="px-5 py-3.5">Jadwal & Peserta</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(201,196,212,0.3)] text-[#111c2d]">
                {filtered.map(item => {
                  const s = statusStyle[item.status];
                  return (
                    <tr key={item.id} className="hover:bg-[#fcfcff] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#4b3f9e] text-[12px] whitespace-nowrap">
                        {item.ticket_number}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#111c2d] line-clamp-1">{item.nama_kegiatan}</span>
                            {item.berkas_url && (
                              <span className="text-[10px] font-bold bg-[#ece9fe] text-[#4b3f9e] px-1.5 py-0.5 rounded shrink-0">
                                📄 Berkas
                              </span>
                            )}
                          </div>
                          <span className="text-[#787583] text-[11px]">
                            {item.user?.name || '-'} · {item.organisasi}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#474552] whitespace-nowrap">
                        {item.room?.name || '-'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-[#111c2d]">{item.tanggal}</span>
                          <span className="text-[#787583] text-[11px]">{item.jam_mulai}–{item.jam_selesai} WIB · {item.estimasi_peserta} org</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                          style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelected(item)}
                            className="px-3 py-1.5 rounded-[6px] border border-[rgba(201,196,212,0.7)] text-[#474552] hover:bg-[#f5f6fa] text-[12px] font-semibold transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                          {item.status === 'menunggu' && (
                            <>
                              <button
                                onClick={() => { setSelected(item); setAction('approve'); }}
                                className="w-7 h-7 rounded-[6px] bg-[#d1fae5] flex items-center justify-center hover:bg-[#a7f3d0] transition-colors cursor-pointer"
                                title="Setujui"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              </button>
                              <button
                                onClick={() => { setSelected(item); setAction('reject'); }}
                                className="w-7 h-7 rounded-[6px] bg-[#fee2e2] flex items-center justify-center hover:bg-[#fecdd3] transition-colors cursor-pointer"
                                title="Tolak"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </>
                          )}
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

      {/* Modal Detail / Aksi */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[16px] max-w-[540px] w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[12px] font-bold text-[#4b3f9e]">{selected.ticket_number}</span>
                <h3 className="text-[#111c2d] text-[18px] font-bold leading-snug mt-0.5">{selected.nama_kegiatan}</h3>
              </div>
              <button onClick={() => { setSelected(null); setAction(null); }} className="text-[#787583] hover:text-[#111c2d] text-[20px] font-bold cursor-pointer">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px] bg-[#f8f9fc] p-4 rounded-[10px] border border-[rgba(201,196,212,0.3)]">
              <div><span className="text-[#787583]">Pemohon:</span> <p className="font-semibold text-[#111c2d]">{selected.user?.name || '-'} ({selected.user?.nim || '-'})</p></div>
              <div><span className="text-[#787583]">Organisasi:</span> <p className="font-semibold text-[#111c2d]">{selected.organisasi}</p></div>
              <div><span className="text-[#787583]">Ruangan:</span> <p className="font-semibold text-[#111c2d]">{selected.room?.name || '-'}</p></div>
              <div><span className="text-[#787583]">Tanggal:</span> <p className="font-semibold text-[#111c2d]">{selected.tanggal}</p></div>
              <div><span className="text-[#787583]">Waktu:</span> <p className="font-semibold text-[#111c2d]">{selected.jam_mulai} – {selected.jam_selesai} WIB</p></div>
              <div><span className="text-[#787583]">Estimasi Peserta:</span> <p className="font-semibold text-[#111c2d]">{selected.estimasi_peserta} Orang</p></div>
              {selected.fasilitas && selected.fasilitas.length > 0 && (
                <div className="col-span-2">
                  <span className="text-[#787583]">Fasilitas Dibutuhkan:</span>
                  <p className="font-semibold text-[#111c2d]">{selected.fasilitas.join(', ')}</p>
                </div>
              )}
              {selected.keperluan && (
                <div className="col-span-2">
                  <span className="text-[#787583]">Keperluan:</span>
                  <p className="text-[#474552]">{selected.keperluan}</p>
                </div>
              )}
              {selected.catatan && (
                <div className="col-span-2">
                  <span className="text-[#787583]">Catatan Pemohon:</span>
                  <p className="text-[#474552]">{selected.catatan}</p>
                </div>
              )}
              {selected.berkas_url && (
                <div className="col-span-2 bg-[#ece9fe]/40 border border-[#c7c4d4] p-3 rounded-[10px] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[22px]">📄</span>
                    <div className="flex flex-col min-w-0">
                      <p className="font-bold text-[#111c2d] text-[12px] truncate">{selected.berkas_name || 'Dokumen Proposal'}</p>
                      <p className="text-[#787583] text-[11px]">Lampiran Proposal / Surat Izin</p>
                    </div>
                  </div>
                  <a
                    href={selected.berkas_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-[8px] transition-colors shrink-0 flex items-center gap-1 shadow-sm"
                  >
                    <span>⬇️</span> Unduh Dokumen
                  </a>
                </div>
              )}
              {selected.reject_note && (
                <div className="col-span-2 bg-[#fee2e2]/60 p-2.5 rounded-[6px] border border-[#fecdd3]">
                  <span className="text-[#991b1b] font-semibold">Alasan Penolakan:</span>
                  <p className="text-[#991b1b]">{selected.reject_note}</p>
                </div>
              )}
            </div>

            {action === 'reject' && (
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-[#111c2d]">Alasan Penolakan:</label>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara jelas untuk pemohon..."
                  className="w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] p-3 text-[13px] outline-none focus:border-[#ba1a1a] h-24"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(201,196,212,0.3)]">
              <button
                onClick={() => { setSelected(null); setAction(null); }}
                className="px-4 py-2 border border-[rgba(201,196,212,0.7)] rounded-[8px] text-[13px] font-semibold text-[#474552] hover:bg-[#f5f6fa] cursor-pointer"
              >
                Tutup
              </button>
              {selected.status === 'menunggu' && !action && (
                <>
                  <button
                    onClick={() => setAction('reject')}
                    className="px-4 py-2 bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecdd3] rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer"
                  >
                    Tolak Pengajuan
                  </button>
                  <button
                    onClick={() => handleApprove(selected)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#4b3f9e] hover:bg-[#342586] text-white rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Setujui Pengajuan
                  </button>
                </>
              )}
              {action === 'approve' && (
                <button
                  onClick={() => handleApprove(selected)}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#065f46] hover:bg-[#044e39] text-white rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Konfirmasi Setujui
                </button>
              )}
              {action === 'reject' && (
                <button
                  onClick={() => handleReject(selected)}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#ba1a1a] hover:bg-[#931515] text-white rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Konfirmasi Tolak
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[16px] max-w-[500px] w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#ece9fe] text-[#4b3f9e] flex items-center justify-center font-bold text-sm">
                  📄
                </span>
                <div>
                  <h3 className="text-[#111c2d] text-[18px] font-bold">Import Data CSV</h3>
                  <p className="text-[#787583] text-[12px]">Unggah berkas spreadsheet peminjaman kampus</p>
                </div>
              </div>
              <button
                onClick={() => { setShowImportModal(false); setImportFile(null); }}
                className="text-[#787583] hover:text-[#111c2d] text-[20px] font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Template Download Help */}
            <div className="bg-[#f8f9fc] border border-[rgba(201,196,212,0.4)] rounded-[12px] p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[#111c2d]">Format Standar CSV 2026</p>
                <p className="text-[11px] text-[#787583]">Gunakan template resmi agar data kolom terbaca sempurna.</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="shrink-0 px-3 py-1.5 bg-white border border-[rgba(201,196,212,0.7)] hover:bg-[#ece9fe] text-[#4b3f9e] text-[12px] font-semibold rounded-[8px] transition-colors cursor-pointer"
              >
                Unduh Template
              </button>
            </div>

            {/* Error banner */}
            {importError && (
              <div className="bg-[#fee2e2] border border-[#fecdd3] rounded-[10px] p-3 text-[#991b1b] text-[12px]">
                {importError}
              </div>
            )}

            {/* Upload Area */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#474552]">Pilih File CSV (.csv):</label>
              <div
                className="border-2 border-dashed border-[rgba(201,196,212,0.8)] hover:border-[#4b3f9e] rounded-[12px] p-6 text-center flex flex-col items-center justify-center gap-2 bg-[#fcfcff] cursor-pointer transition-colors"
                onClick={() => document.getElementById('csvFileInput')?.click()}
              >
                <input
                  id="csvFileInput"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0]);
                      setImportError('');
                    }
                  }}
                />
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4b3f9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {importFile ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[13px] font-bold text-[#111c2d]">{importFile.name}</span>
                    <span className="text-[11px] text-[#787583]">{(importFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] font-semibold text-[#111c2d]">Klik atau seret file CSV ke sini</p>
                    <p className="text-[11px] text-[#787583]">Maksimal ukuran file 10 MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(201,196,212,0.3)]">
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportFile(null); }}
                className="px-4 py-2 border rounded-[8px] text-[13px] font-semibold text-[#474552] hover:bg-[#f5f6fa] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importFile || importLoading}
                className="px-5 py-2 bg-[#4b3f9e] hover:bg-[#342586] text-white rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {importLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  'Mulai Impor CSV'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
