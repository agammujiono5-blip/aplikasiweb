import { useState, useRef } from 'react';
import { api } from '../../api/client';
import type { PeminjamanItem, RoomItem } from '../../api/client';
import { useLiveQuery } from '../../api/client';

const statusStyle: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  menunggu:  { bg: '#fef3c7', border: '#fde68a', text: '#92400e', dot: '#d97706', label: 'Menunggu Verifikasi' },
  disetujui: { bg: '#d1fae5', border: '#a7f3d0', text: '#065f46', dot: '#059669', label: 'Disetujui' },
  ditolak:   { bg: '#fee2e2', border: '#fecdd3', text: '#991b1b', dot: '#dc2626', label: 'Ditolak' },
};

const MONTHS = [
  { value: '', label: 'Semua Bulan' },
  ...Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, i, 1);
    return { value: `2026-${String(i + 1).padStart(2, '0')}`, label: d.toLocaleString('id-ID', { month: 'long', year: 'numeric' }) };
  }),
];

interface RiwayatPageProps {
  onNavigate?: (page: string) => void;
}

export default function RiwayatPage({ onNavigate }: RiwayatPageProps) {
  const [activeTab, setActiveTab] = useState<'saya' | 'kampus'>('saya');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [search, setSearch] = useState('');
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<PeminjamanItem | null>(null);
  const [editingItem, setEditingItem] = useState<PeminjamanItem | null>(null);
  const [editForm, setEditForm] = useState({
    namaKegiatan: '',
    organisasi: '',
    jenisKegiatan: '',
    ruangan: '',
    tanggal: '',
    jamMulai: '',
    jamSelesai: '',
    estimasiPeserta: '',
    keperluan: '',
    fasilitas: [] as string[],
    catatan: '',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const editFileRef = useRef<HTMLInputElement>(null);

  const facilityOptions = ['Proyektor', 'Sound System', 'Whiteboard', 'AC', 'Lighting', 'Podium', 'Kursi Tambahan', 'PC Workstation'];

  // Fetch rooms for edit modal
  const { data: allRooms } = useLiveQuery<RoomItem[]>(() => api.rooms.getAll(), [], 30000);
  const rooms = Array.isArray(allRooms) ? allRooms : [];

  // Get active logged-in user name
  let userName = 'Anda';
  try {
    const rawUser = localStorage.getItem('user_data');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      userName = u.nama || u.name || 'Anda';
    }
  } catch {
    // fallback
  }

  // 1. Live Query: User's personal application history
  const { data: rawUserItems, refetch: refetchUser } = useLiveQuery<PeminjamanItem[]>(
    () => api.peminjaman.getUserHistory(),
    [],
    10000
  );
  const userItems = Array.isArray(rawUserItems) ? rawUserItems : [];

  // 2. Live Query: Campus-wide approved bookings (synced with Jadwal Ruangan)
  const { data: rawCampusItems } = useLiveQuery<PeminjamanItem[]>(
    () => api.peminjaman.getCampusApproved(),
    [],
    10000
  );
  const campusItems = Array.isArray(rawCampusItems) ? rawCampusItems : [];

  // Filter for Personal History
  const filteredUser = userItems.filter(item => {
    const matchStatus = filterStatus === 'semua' || item.status === filterStatus;
    const matchBulan = !filterBulan || item.tanggal.startsWith(filterBulan);
    const q = search.toLowerCase();
    const matchSearch = !q || item.nama_kegiatan.toLowerCase().includes(q)
      || item.ticket_number.toLowerCase().includes(q)
      || (item.room?.name || '').toLowerCase().includes(q);
    return matchStatus && matchBulan && matchSearch;
  });

  // Filter for Campus-wide Approved
  const filteredCampus = campusItems.filter(item => {
    const matchBulan = !filterBulan || item.tanggal.startsWith(filterBulan);
    const q = search.toLowerCase();
    const matchSearch = !q || item.nama_kegiatan.toLowerCase().includes(q)
      || item.ticket_number.toLowerCase().includes(q)
      || (item.room?.name || '').toLowerCase().includes(q)
      || (item.organisasi || '').toLowerCase().includes(q)
      || (item.user?.name || '').toLowerCase().includes(q);
    return matchBulan && matchSearch;
  });

  const handleCancel = async (id: number) => {
    if (!window.confirm('Yakin ingin membatalkan pengajuan ini?')) return;
    setCancelingId(id);
    try {
      await api.peminjaman.cancelUser(id);
      await refetchUser();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCancelingId(null);
    }
  };

  const openEditModal = (item: PeminjamanItem) => {
    setEditingItem(item);
    setEditForm({
      namaKegiatan: item.nama_kegiatan,
      organisasi: item.organisasi,
      jenisKegiatan: item.jenis_kegiatan || '',
      ruangan: String(item.room_id),
      tanggal: item.tanggal,
      jamMulai: item.jam_mulai,
      jamSelesai: item.jam_selesai,
      estimasiPeserta: String(item.estimasi_peserta),
      keperluan: item.keperluan || '',
      fasilitas: Array.isArray(item.fasilitas) ? item.fasilitas : [],
      catatan: item.catatan || '',
    });
    setEditFile(null);
    setEditError('');
    setSelectedItem(null);
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;
    if (!editForm.namaKegiatan || !editForm.ruangan || !editForm.tanggal || !editForm.jamMulai || !editForm.jamSelesai) {
      setEditError('Harap lengkapi semua data wajib.');
      return;
    }
    if (editForm.jamMulai >= editForm.jamSelesai) {
      setEditError('Jam selesai harus lebih akhir dari jam mulai.');
      return;
    }
    setEditSubmitting(true);
    setEditError('');
    try {
      await api.peminjaman.updateUser(editingItem.id, {
        nama_kegiatan: editForm.namaKegiatan,
        organisasi: editForm.organisasi,
        jenis_kegiatan: editForm.jenisKegiatan,
        room_id: parseInt(editForm.ruangan),
        tanggal: editForm.tanggal,
        jam_mulai: editForm.jamMulai,
        jam_selesai: editForm.jamSelesai,
        estimasi_peserta: parseInt(editForm.estimasiPeserta) || 1,
        keperluan: editForm.keperluan,
        fasilitas: editForm.fasilitas,
        catatan: editForm.catatan,
        berkas: editFile,
      });
      setEditingItem(null);
      await refetchUser();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditSubmitting(false);
    }
  };

  const isSayaTab = activeTab === 'saya';
  const currentList = isSayaTab ? filteredUser : filteredCampus;
  const currentTotal = isSayaTab ? userItems.length : campusItems.length;

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#111c2d] text-[22px] font-bold tracking-[-0.4px]">Riwayat Peminjaman</h1>
          <p className="text-[#787583] text-[13px] mt-1">
            Pantau status pengajuan ruangan pribadi atau seluruh peminjaman yang telah disetujui di kampus.
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('ajukan')}
            className="shrink-0 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            + Ajukan Peminjaman
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(201,196,212,0.4)] gap-6">
        <button
          onClick={() => { setActiveTab('saya'); setSearch(''); setFilterStatus('semua'); setFilterBulan(''); }}
          className={`pb-3 text-[14px] font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
            isSayaTab
              ? 'text-[#4b3f9e] border-b-2 border-[#4b3f9e]'
              : 'text-[#787583] hover:text-[#111c2d]'
          }`}
        >
          <span>Pengajuan Saya</span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors"
            style={{
              backgroundColor: isSayaTab ? '#ece9fe' : '#f0f1f5',
              color: isSayaTab ? '#4b3f9e' : '#787583'
            }}
          >
            {userItems.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('kampus'); setSearch(''); setFilterStatus('semua'); setFilterBulan(''); }}
          className={`pb-3 text-[14px] font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
            !isSayaTab
              ? 'text-[#4b3f9e] border-b-2 border-[#4b3f9e]'
              : 'text-[#787583] hover:text-[#111c2d]'
          }`}
        >
          <span>Agenda Kampus Disetujui</span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors"
            style={{
              backgroundColor: !isSayaTab ? '#d1fae5' : '#f0f1f5',
              color: !isSayaTab ? '#065f46' : '#787583'
            }}
          >
            {campusItems.length}
          </span>
        </button>
      </div>

      {/* Scope Info Card */}
      {isSayaTab ? (
        <div className="bg-[#f8f7ff] border border-[#e0ddfc] rounded-[10px] px-4 py-3 flex items-start gap-3 text-[12px] text-[#4b3f9e]">
          <div className="w-5 h-5 rounded-full bg-[#ece9fe] flex items-center justify-center shrink-0 mt-0.5 text-[#4b3f9e]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </div>
          <div>
            <strong>Catatan Pengajuan Pribadi:</strong> Tab ini menampilkan pengajuan yang diajukan oleh akun Anda (<strong>{userName}</strong>). Untuk melihat seluruh kegiatan ruangan kampus yang sedang/akan berlangsung, buka tab <strong>Agenda Kampus Disetujui</strong> atau menu <strong>Jadwal Ruangan</strong>.
          </div>
        </div>
      ) : (
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] px-4 py-3 flex items-start gap-3 text-[12px] text-[#166534]">
          <div className="w-5 h-5 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0 mt-0.5 text-[#166534]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <strong>Agenda Publik Kampus:</strong> Menampilkan seluruh peminjaman ruangan yang telah disetujui di lingkungan kampus (sinkron persis dengan kegiatan pada menu <strong>Jadwal Ruangan</strong>).
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder={isSayaTab ? "Cari nama kegiatan, tiket, ruangan..." : "Cari kegiatan, tiket, ruangan, pemohon..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-[38px] flex-1 min-w-[200px] px-4 rounded-[10px] border border-[rgba(201,196,212,0.6)] text-[13px] outline-none focus:border-[#4b3f9e] bg-white text-[#111c2d] placeholder-[#787583]"
        />
        {isSayaTab && (
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-[38px] px-3 rounded-[10px] border border-[rgba(201,196,212,0.6)] text-[13px] outline-none focus:border-[#4b3f9e] bg-white text-[#111c2d]"
          >
            <option value="semua">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
        )}
        <select
          value={filterBulan}
          onChange={e => setFilterBulan(e.target.value)}
          className="h-[38px] px-3 rounded-[10px] border border-[rgba(201,196,212,0.6)] text-[13px] outline-none focus:border-[#4b3f9e] bg-white text-[#111c2d]"
        >
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* Count */}
      <div className="text-[#787583] text-[12px]">
        Menampilkan <strong className="text-[#111c2d]">{currentList.length}</strong> dari {currentTotal} {isSayaTab ? 'pengajuan Anda' : 'peminjaman kampus disetujui'}
      </div>

      {/* Table / Cards */}
      {isSayaTab && userItems.length === 0 ? (
        /* Empty state specifically when user has never made any application */
        <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-8 sm:p-12 text-center flex flex-col items-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-[#ece9fe] rounded-full flex items-center justify-center mb-4 text-[#4b3f9e] text-3xl">
            📋
          </div>
          <h3 className="text-[#111c2d] text-[17px] font-bold">Belum Ada Pengajuan Pribadi</h3>
          <p className="text-[#787583] text-[13px] mt-2 mb-6 leading-relaxed">
            Akun Anda (<strong>{userName}</strong>) belum pernah mengajukan peminjaman ruangan. Daftar ruangan yang terisi pada menu <strong>Jadwal Ruangan</strong> merupakan agenda dari seluruh civitas kampus yang telah disetujui.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('ajukan')}
                className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] transition-colors shadow-sm cursor-pointer"
              >
                + Ajukan Peminjaman Sekarang
              </button>
            )}
            <button
              onClick={() => setActiveTab('kampus')}
              className="border border-[rgba(201,196,212,0.8)] hover:bg-[#f8f9fa] text-[#111c2d] text-[13px] font-semibold px-4 py-2.5 rounded-[10px] transition-colors cursor-pointer"
            >
              Lihat Agenda Kampus Disetujui ({campusItems.length})
            </button>
          </div>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-[#787583] text-[14px]">
            {isSayaTab
              ? 'Tidak ada data pengajuan Anda yang sesuai dengan filter pencarian.'
              : 'Tidak ada agenda kampus yang sesuai dengan filter pencarian.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {currentList.map(item => {
            const s = statusStyle[item.status] || { bg: '#f0f1f5', border: '#ddd', text: '#787583', dot: '#787583', label: item.status };
            return (
              <div
                key={item.id}
                className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[14px] p-5 shadow-[0px_1px_3px_rgba(30,41,59,0.04)] hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#111c2d] text-[14px] font-bold">{item.nama_kegiatan}</span>
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                        style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#787583]">
                      <span className="text-[#4b3f9e] font-mono font-medium">{item.ticket_number}</span>
                      {!isSayaTab && (
                        <span>
                          Pemohon: <strong className="text-[#111c2d]">{item.user?.name || item.organisasi}</strong> {item.organisasi && item.user?.name ? `(${item.organisasi})` : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-[#787583] text-[12px]">
                      {item.room?.name || '-'} · {item.tanggal} · {item.jam_mulai}–{item.jam_selesai} WIB · {item.estimasi_peserta} peserta
                    </span>
                    {item.status === 'ditolak' && item.reject_note && (
                      <div className="mt-2 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
                        <span className="text-red-700 text-[11px]"><strong>Alasan:</strong> {item.reject_note}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSayaTab && item.status === 'menunggu' && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); openEditModal(item); }}
                          title="Edit Pengajuan"
                          className="w-7 h-7 rounded-[6px] bg-[#ece9fe] flex items-center justify-center hover:bg-[#dedaff] transition-colors cursor-pointer"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4b3f9e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleCancel(item.id); }}
                          disabled={cancelingId === item.id}
                          title="Batalkan Pengajuan"
                          className="w-7 h-7 rounded-[6px] bg-[#fee2e2] flex items-center justify-center hover:bg-[#fecdd3] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {cancelingId === item.id
                            ? <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          }
                        </button>
                      </>
                    )}
                    <span className="text-[#787583] text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : item.tanggal}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-[520px] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[rgba(201,196,212,0.3)] flex items-center justify-between">
              <h3 className="text-[#111c2d] text-[16px] font-bold">Detail Pengajuan Ruangan</h3>
              <button onClick={() => setSelectedItem(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f6fa] text-[#787583] cursor-pointer">✕</button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-3">
              {[
                ['No. Tiket', selectedItem.ticket_number],
                ['Nama Kegiatan', selectedItem.nama_kegiatan],
                ['Pemohon', selectedItem.user?.name || '-'],
                ['Organisasi', selectedItem.organisasi],
                ['Jenis Kegiatan', selectedItem.jenis_kegiatan || '-'],
                ['Ruangan', selectedItem.room?.name || '-'],
                ['Tanggal', selectedItem.tanggal],
                ['Waktu', `${selectedItem.jam_mulai} – ${selectedItem.jam_selesai} WIB`],
                ['Estimasi Peserta', `${selectedItem.estimasi_peserta} orang`],
                ['Status', selectedItem.status.toUpperCase()],
                ...(selectedItem.reject_note ? [['Alasan Penolakan', selectedItem.reject_note]] : []),
                ...(selectedItem.keperluan ? [['Keperluan', selectedItem.keperluan]] : []),
                ...(selectedItem.catatan ? [['Catatan', selectedItem.catatan]] : []),
                ...(selectedItem.berkas_name ? [['Berkas', selectedItem.berkas_name]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-[#787583] text-[12px] w-[140px] shrink-0">{label}</span>
                  <span className="text-[#111c2d] text-[13px] font-medium flex-1">{value}</span>
                </div>
              ))}
            </div>
            {isSayaTab && selectedItem.status === 'menunggu' && (
              <div className="px-6 pb-5">
                <button
                  onClick={() => openEditModal(selectedItem)}
                  className="w-full bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold py-2.5 rounded-[10px] transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  Edit Pengajuan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-[640px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[rgba(201,196,212,0.3)] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-[#111c2d] text-[16px] font-bold">Edit Pengajuan Peminjaman</h3>
                <span className="text-[#4b3f9e] text-[12px] font-mono font-medium">{editingItem.ticket_number}</span>
              </div>
              <button onClick={() => setEditingItem(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f6fa] text-[#787583] cursor-pointer">✕</button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
              {editError && (
                <div className="bg-[#fee2e2] border border-[#fecdd3] text-[#991b1b] px-4 py-3 rounded-[10px] text-[12px] font-medium flex items-center justify-between">
                  <span>{editError}</span>
                  <button onClick={() => setEditError('')} className="text-current font-bold text-[14px] cursor-pointer">×</button>
                </div>
              )}

              {/* Nama Kegiatan */}
              <div>
                <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Nama Kegiatan *</label>
                <input
                  value={editForm.namaKegiatan}
                  onChange={e => setEditForm(prev => ({ ...prev, namaKegiatan: e.target.value }))}
                  className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white"
                />
              </div>

              {/* Organisasi & Jenis Kegiatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Organisasi *</label>
                  <input
                    value={editForm.organisasi}
                    onChange={e => setEditForm(prev => ({ ...prev, organisasi: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Jenis Kegiatan</label>
                  <select
                    value={editForm.jenisKegiatan}
                    onChange={e => setEditForm(prev => ({ ...prev, jenisKegiatan: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white cursor-pointer"
                  >
                    <option value="">-- Pilih --</option>
                    <option>Seminar / Workshop</option>
                    <option>Pelatihan / Bootcamp</option>
                    <option>Rapat Anggota / Musyawarah</option>
                    <option>Kuliah Tamu / Webinar</option>
                    <option>Latihan Rutin / Persiapan Lomba</option>
                    <option>Pameran / Gelar Karya</option>
                  </select>
                </div>
              </div>

              {/* Ruangan */}
              <div>
                <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Ruangan *</label>
                <select
                  value={editForm.ruangan}
                  onChange={e => setEditForm(prev => ({ ...prev, ruangan: e.target.value }))}
                  className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white cursor-pointer"
                >
                  <option value="">-- Pilih Ruangan --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={String(r.id)} disabled={r.status === 'maintenance'}>
                      {r.name} ({r.gedung} · Kapasitas: {r.kapasitas}) {r.status === 'maintenance' ? '(Maintenance)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={editForm.tanggal}
                    onChange={e => setEditForm(prev => ({ ...prev, tanggal: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Jam Mulai *</label>
                  <input
                    type="time"
                    value={editForm.jamMulai}
                    onChange={e => setEditForm(prev => ({ ...prev, jamMulai: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Jam Selesai *</label>
                  <input
                    type="time"
                    value={editForm.jamSelesai}
                    onChange={e => setEditForm(prev => ({ ...prev, jamSelesai: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white"
                  />
                </div>
              </div>

              {/* Estimasi Peserta */}
              <div>
                <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Estimasi Peserta (Orang)</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.estimasiPeserta}
                  onChange={e => setEditForm(prev => ({ ...prev, estimasiPeserta: e.target.value }))}
                  className="w-full sm:w-[180px] bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white"
                />
              </div>

              {/* Fasilitas */}
              <div>
                <label className="text-[12px] font-semibold text-[#111c2d] block mb-1.5">Fasilitas Tambahan</label>
                <div className="flex flex-wrap gap-1.5">
                  {facilityOptions.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setEditForm(prev => ({
                        ...prev,
                        fasilitas: prev.fasilitas.includes(f)
                          ? prev.fasilitas.filter(x => x !== f)
                          : [...prev.fasilitas, f],
                      }))}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                        editForm.fasilitas.includes(f)
                          ? 'bg-[#ece9fe] text-[#4b3f9e] border-[#4b3f9e]'
                          : 'border-[rgba(201,196,212,0.6)] text-[#474552] hover:bg-[#f8f9fc]'
                      }`}
                    >
                      {editForm.fasilitas.includes(f) ? '✓ ' : '+ '}{f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keperluan */}
              <div>
                <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Keperluan / Deskripsi</label>
                <textarea
                  value={editForm.keperluan}
                  onChange={e => setEditForm(prev => ({ ...prev, keperluan: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] p-3 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white resize-none"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Catatan Tambahan</label>
                <textarea
                  value={editForm.catatan}
                  onChange={e => setEditForm(prev => ({ ...prev, catatan: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] p-3 text-[13px] outline-none focus:border-[#4b3f9e] focus:bg-white resize-none"
                />
              </div>

              {/* Berkas */}
              <div>
                <label className="text-[12px] font-semibold text-[#111c2d] block mb-1">Ganti Dokumen Lampiran (Opsional)</label>
                {editingItem.berkas_name && !editFile && (
                  <p className="text-[11px] text-[#787583] mb-1.5">Dokumen saat ini: <strong className="text-[#4b3f9e]">{editingItem.berkas_name}</strong></p>
                )}
                <input
                  ref={editFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const ext = file.name.split('.').pop()?.toLowerCase();
                      if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
                        setEditError('Format file harus PDF atau Word (.doc, .docx).');
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        setEditError('Ukuran file maksimal 10MB.');
                        return;
                      }
                      setEditFile(file);
                      setEditError('');
                    }
                  }}
                />
                {editFile ? (
                  <div className="flex items-center gap-2 bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b3f9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span className="text-[12px] text-[#111c2d] font-medium flex-1 truncate">{editFile.name} ({(editFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={() => { setEditFile(null); if (editFileRef.current) editFileRef.current.value = ''; }}
                      className="text-red-500 text-[11px] font-semibold hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileRef.current?.click()}
                    className="inline-flex items-center gap-2 text-[12px] text-[#4b3f9e] font-semibold border border-dashed border-[rgba(201,196,212,0.8)] hover:border-[#4b3f9e] rounded-[8px] px-4 py-2 hover:bg-[#ece9fe]/20 transition-all cursor-pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    Pilih File Baru (PDF / Word)
                  </button>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-[rgba(201,196,212,0.3)] flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-[rgba(201,196,212,0.7)] rounded-[8px] text-[13px] font-semibold text-[#474552] hover:bg-[#f5f6fa] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editSubmitting}
                className="px-5 py-2 bg-[#4b3f9e] hover:bg-[#342586] text-white rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {editSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
