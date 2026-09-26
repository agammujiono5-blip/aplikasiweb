import { useState, useRef } from 'react';
import { api, useLiveQuery } from '../../api/client';
import type { PeminjamanItem, RoomItem } from '../../api/client';

interface AjukanProps {
  onNavigate: (page: string) => void;
}

const DEFAULT_ROOMS: RoomItem[] = [
  { id: 1, name: 'Auditorium Rektorat Lt. 3', gedung: 'Gedung Rektorat', kapasitas: 500, fasilitas: ['Proyektor', 'Sound System', 'AC', 'Lighting', 'Podium'], status: 'tersedia', peminjaman_count: 13 },
  { id: 2, name: 'Aula Gedung A', gedung: 'Gedung A', kapasitas: 300, fasilitas: ['Proyektor', 'Sound System', 'AC', 'Podium'], status: 'tersedia', peminjaman_count: 11 },
  { id: 3, name: 'Lab Komputer B-101', gedung: 'Gedung B', kapasitas: 40, fasilitas: ['PC Workstation', 'AC', 'Proyektor'], status: 'tersedia', peminjaman_count: 5 },
  { id: 4, name: 'Ruang Seminar C-205', gedung: 'Gedung C', kapasitas: 80, fasilitas: ['Proyektor', 'Whiteboard', 'AC'], status: 'tersedia', peminjaman_count: 7 },
  { id: 5, name: 'Lab Multimedia Fasilkom', gedung: 'Gedung Fasilkom', kapasitas: 40, fasilitas: ['PC Workstation', 'AC'], status: 'tersedia', peminjaman_count: 10 },
  { id: 6, name: 'Ruang Rapat Dekanat', gedung: 'Gedung Rektorat', kapasitas: 20, fasilitas: ['TV LED', 'AC', 'Whiteboard'], status: 'maintenance', peminjaman_count: 3 },
];

const facilityOptions = ['Proyektor', 'Sound System', 'Whiteboard', 'AC', 'Lighting', 'Podium', 'Kursi Tambahan', 'PC Workstation'];

type Step = 1 | 2 | 3;

export default function AjukanPeminjaman({ onNavigate }: AjukanProps) {
  const [step, setStep] = useState<Step>(1);
  const [createdTicket, setCreatedTicket] = useState<PeminjamanItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch live rooms from backend with robust default fallback
  const { data: allRooms, loading: roomsLoading } = useLiveQuery(() => api.rooms.getAll());
  const rooms = (allRooms && allRooms.length > 0) ? allRooms : DEFAULT_ROOMS;

  // Fetch live schedule for conflict detection
  const { data: allJadwal } = useLiveQuery(() => api.jadwal.get());

  const storedUser = localStorage.getItem('user_data');
  let user: { organisasi?: string; name?: string; nama?: string; nim?: string } | null = null;
  try {
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (!parsed?.petugas_id && !parsed?.name?.toLowerCase().includes('petugas') && parsed?.email !== 'admin@kampus.ac.id') {
        user = parsed;
      }
    }
  } catch {
    // ignore
  }

  const [form, setForm] = useState({
    namaKegiatan: '',
    organisasi: user?.organisasi || (user?.nama || user?.name ? `HIMA / UKM ${(user?.nama || user?.name)}` : 'BEM Universitas'),
    jenisKegiatan: 'Seminar / Workshop',
    ruangan: '',
    tanggal: '',
    jamMulai: '08:00',
    jamSelesai: '12:00',
    estimasiPeserta: '50',
    keperluan: '',
    fasilitas: ['Proyektor', 'AC'] as string[],
    catatan: '',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleFasilitas = (f: string) => {
    setForm(prev => ({
      ...prev,
      fasilitas: prev.fasilitas.includes(f)
        ? prev.fasilitas.filter(x => x !== f)
        : [...prev.fasilitas, f],
    }));
  };

  const selectedRoom = rooms.find(r => String(r.id) === form.ruangan);

  // Identify booked slots for chosen room and date
  const bookedSlotsOnDate = (allJadwal && form.tanggal && allJadwal[form.tanggal])
    ? allJadwal[form.tanggal].filter(j =>
        selectedRoom ? j.room.toLowerCase().includes(selectedRoom.name.toLowerCase()) : false
      )
    : [];

  // Detect time overlap
  const conflictBooking = bookedSlotsOnDate.find(b => {
    const parts = b.time.split('-').map(s => s.trim().replace(' WIB', ''));
    if (parts.length === 2) {
      const [start, end] = parts;
      return form.jamMulai < end && form.jamSelesai > start;
    }
    return false;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
        setErrorMsg('Format file harus berupa PDF atau Dokumen Word (.doc, .docx).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Ukuran file maksimal 10MB.');
        return;
      }
      setErrorMsg('');
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!form.namaKegiatan || !form.ruangan || !form.tanggal || !form.jamMulai || !form.jamSelesai) {
      setErrorMsg('Harap lengkapi semua data wajib pada formulir.');
      return;
    }

    if (form.jamMulai >= form.jamSelesai) {
      setErrorMsg('Jam selesai harus lebih akhir dari jam mulai.');
      return;
    }

    if (conflictBooking) {
      setErrorMsg(`Jadwal bentrok: Ruangan sudah dipesan untuk kegiatan "${conflictBooking.title}" (${conflictBooking.time}). Silakan ubah jam atau pilih ruangan lain.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.peminjaman.submitUser({
        nama_kegiatan: form.namaKegiatan,
        organisasi: form.organisasi,
        jenis_kegiatan: form.jenisKegiatan,
        room_id: parseInt(form.ruangan),
        tanggal: form.tanggal,
        jam_mulai: form.jamMulai,
        jam_selesai: form.jamSelesai,
        estimasi_peserta: parseInt(form.estimasiPeserta) || 1,
        keperluan: form.keperluan,
        fasilitas: form.fasilitas,
        catatan: form.catatan,
        berkas: selectedFile,
      });

      setCreatedTicket(res.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdTicket) {
    return (
      <div className="px-6 lg:px-10 py-8 w-full max-w-full flex flex-col items-center gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[20px] p-8 lg:p-10 max-w-[680px] w-full shadow-sm text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[#d1fae5] flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[14px] font-bold text-[#4b3f9e] bg-[#ece9fe] px-4 py-1.5 rounded-full self-center">
              {createdTicket.ticket_number}
            </span>
            <h2 className="text-[#111c2d] text-[24px] lg:text-[28px] font-bold tracking-[-0.6px]">
              Pengajuan Peminjaman Berhasil Dikirim!
            </h2>
            <p className="text-[#474552] text-[14px] leading-[22px]">
              Permohonan peminjaman ruang untuk <strong>{createdTicket.nama_kegiatan}</strong> telah tersimpan di sistem server UNY.
              Petugas Sarpras akan segera memverifikasi permohonan Anda.
            </p>
          </div>

          <div className="bg-[#f8f9fc] border border-[rgba(201,196,212,0.5)] rounded-[12px] p-5 w-full text-left flex flex-col gap-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#787583]">Ruangan</span>
              <span className="text-[#111c2d] font-semibold">{createdTicket.room?.name ?? selectedRoom?.name ?? '-'}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#787583]">Tanggal Peminjaman</span>
              <span className="text-[#111c2d] font-semibold">{createdTicket.tanggal}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#787583]">Waktu Kegiatan</span>
              <span className="text-[#111c2d] font-semibold">{createdTicket.jam_mulai} – {createdTicket.jam_selesai} WIB</span>
            </div>
            {createdTicket.berkas_name && (
              <div className="flex justify-between text-[13px]">
                <span className="text-[#787583]">Dokumen Terlampir</span>
                <span className="text-[#4b3f9e] font-semibold flex items-center gap-1">
                  📄 {createdTicket.berkas_name}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[13px]">
              <span className="text-[#787583]">Status Pengajuan</span>
              <span className="bg-[#fef3c7] text-[#92400e] text-[11px] font-bold px-3 py-0.5 rounded-full border border-[#fde68a]">
                Menunggu Verifikasi Admin
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => onNavigate('riwayat')}
              className="flex-1 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[14px] font-semibold py-3 rounded-[10px] transition-colors cursor-pointer shadow-sm"
            >
              Lihat Riwayat &amp; Status Pengajuan
            </button>
            <button
              onClick={() => {
                setCreatedTicket(null);
                setSelectedFile(null);
                setStep(1);
                setForm({
                  namaKegiatan: '',
                  organisasi: user?.organisasi || (user?.name ? `Organisasi ${user.name}` : 'BEM Fasilkom'),
                  jenisKegiatan: 'Seminar / Workshop',
                  ruangan: '',
                  tanggal: '',
                  jamMulai: '08:00',
                  jamSelesai: '12:00',
                  estimasiPeserta: '50',
                  keperluan: '',
                  fasilitas: ['Proyektor', 'AC'],
                  catatan: '',
                });
              }}
              className="flex-1 border border-[rgba(201,196,212,0.7)] text-[#474552] text-[14px] font-semibold py-3 rounded-[10px] hover:bg-[#f5f6fa] transition-colors cursor-pointer"
            >
              Ajukan Peminjaman Lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[#111c2d] text-[28px] lg:text-[32px] font-bold tracking-[-0.8px]">
          Formulir Pengajuan Peminjaman Ruang
        </h1>
        <p className="text-[#474552] text-[14px]">
          Lengkapi data kegiatan dan lampirkan dokumen pendukung (PDF/Word) untuk persetujuan petugas Sarpras.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-[#fee2e2] border border-[#fecdd3] text-[#991b1b] px-4 py-3 rounded-[12px] text-[13px] font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-current font-bold text-[16px]">×</button>
        </div>
      )}

      {/* Stepper Header */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[14px] p-4 flex items-center gap-2 shadow-sm">
        {[
          { num: 1, label: 'Informasi Kegiatan' },
          { num: 2, label: 'Pilih Ruang & Jadwal' },
          { num: 3, label: 'Dokumen & Konfirmasi' },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all
              ${step === s.num ? 'bg-[#4b3f9e] text-white shadow-sm' : step > s.num ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f0f1f5] text-[#787583]'}`}>
              {step > s.num ? '✓' : s.num}
            </div>
            <span className={`text-[13px] font-medium hidden sm:inline ${step === s.num ? 'text-[#111c2d] font-bold' : 'text-[#787583]'}`}>
              {s.label}
            </span>
            {idx < 2 && <div className="flex-1 h-[2px] bg-[#e2e8f0] mx-2" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Kegiatan */}
      {step === 1 && (
        <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-6 lg:p-8 shadow-sm flex flex-col gap-6">
          <h2 className="text-[#111c2d] text-[18px] font-bold pb-3 border-b border-[rgba(201,196,212,0.3)] flex items-center gap-2">
            <span>📝</span> Tahap 1: Detail &amp; Keperluan Kegiatan
          </h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[13px] font-semibold text-[#111c2d] block mb-1.5">Nama Kegiatan *</label>
              <input
                value={form.namaKegiatan}
                onChange={e => update('namaKegiatan', e.target.value)}
                placeholder="contoh: Seminar Nasional Tren Teknologi AI & Cloud 2026"
                className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-4 py-2.5 text-[14px] outline-none focus:border-[#4b3f9e] focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-semibold text-[#111c2d] block mb-1.5">Organisasi / Lembaga / Panitia *</label>
                <input
                  value={form.organisasi}
                  onChange={e => update('organisasi', e.target.value)}
                  placeholder="contoh: BEM Fasilkom / UKM Musik UNY"
                  className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-4 py-2.5 text-[14px] outline-none focus:border-[#4b3f9e] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#111c2d] block mb-1.5">Jenis Kegiatan</label>
                <select
                  value={form.jenisKegiatan}
                  onChange={e => update('jenisKegiatan', e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-4 py-2.5 text-[14px] outline-none focus:border-[#4b3f9e] focus:bg-white transition-all cursor-pointer"
                >
                  <option>Seminar / Workshop</option>
                  <option>Pelatihan / Bootcamp</option>
                  <option>Rapat Anggota / Musyawarah</option>
                  <option>Kuliah Tamu / Webinar</option>
                  <option>Latihan Rutin / Persiapan Lomba</option>
                  <option>Pameran / Gelar Karya</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#111c2d] block mb-1.5">Deskripsi &amp; Keperluan Kegiatan</label>
              <textarea
                value={form.keperluan}
                onChange={e => update('keperluan', e.target.value)}
                placeholder="Tuliskan tujuan kegiatan, rangkaian acara, atau latar belakang permohonan peminjaman..."
                rows={3}
                className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] p-4 text-[14px] outline-none focus:border-[#4b3f9e] focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[rgba(201,196,212,0.3)]">
            <button
              onClick={() => {
                if (!form.namaKegiatan.trim()) {
                  setErrorMsg('Nama kegiatan wajib diisi.');
                  return;
                }
                if (!form.organisasi.trim()) {
                  setErrorMsg('Nama organisasi/panitia wajib diisi.');
                  return;
                }
                setErrorMsg('');
                setStep(2);
              }}
              className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-6 py-2.5 rounded-[10px] transition-colors cursor-pointer shadow-sm flex items-center gap-2"
            >
              Lanjut: Pilih Ruang &amp; Jadwal →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Ruangan & Jadwal */}
      {step === 2 && (
        <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-6 lg:p-8 shadow-sm flex flex-col gap-6">
          <h2 className="text-[#111c2d] text-[18px] font-bold pb-3 border-b border-[rgba(201,196,212,0.3)] flex items-center gap-2">
            <span>🏛️</span> Tahap 2: Pemilihan Ruang &amp; Jadwal Waktu
          </h2>

          <div className="flex flex-col gap-5">
            {/* Ruangan Selection */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-[#111c2d]">
                  Pilih Ruangan Kampus *
                </label>
                {roomsLoading && (
                  <span className="text-[11px] text-[#787583] flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-[#4b3f9e] border-t-transparent rounded-full animate-spin inline-block" />
                    Menyinkronkan status ruangan...
                  </span>
                )}
              </div>

              {/* Quick Select Dropdown */}
              <select
                value={form.ruangan}
                onChange={e => update('ruangan', e.target.value)}
                className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.8)] rounded-[12px] px-4 py-3 text-[14px] font-semibold text-[#111c2d] outline-none focus:border-[#4b3f9e] focus:bg-white transition-all cursor-pointer shadow-sm"
              >
                <option value="">-- Klik untuk Pilih Ruangan Kampus --</option>
                {rooms.map(r => (
                  <option key={r.id} value={String(r.id)} disabled={r.status === 'maintenance'}>
                    {r.name} ({r.gedung} · Kapasitas: {r.kapasitas} orang · Status: {r.status})
                  </option>
                ))}
              </select>

              {/* Selected Room Banner */}
              {selectedRoom && (
                <div className="bg-[#ece9fe] border border-[#c7c4d4] rounded-[10px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[18px]">🏢</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13px] text-[#4b3f9e] font-bold">
                        Ruangan Dipilih: {selectedRoom.name}
                      </span>
                      <span className="text-[12px] text-[#474552]">
                        ({selectedRoom.gedung} · Kapasitas {selectedRoom.kapasitas} orang)
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-[#d1fae5] text-[#065f46] px-2.5 py-0.5 rounded-full capitalize w-fit">
                    Status: {selectedRoom.status}
                  </span>
                </div>
              )}

              {/* Interactive Room Grid Cards */}
              <p className="text-[#787583] text-[12px] font-medium pt-1">Atau klik salah satu kartu ruangan di bawah ini:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rooms.map(r => {
                  const isSelected = form.ruangan === String(r.id);
                  const isMaintenance = r.status === 'maintenance';
                  const fas = Array.isArray(r.fasilitas) ? r.fasilitas : [];
                  return (
                    <div
                      key={r.id}
                      onClick={() => !isMaintenance && update('ruangan', String(r.id))}
                      className={`p-4 rounded-[12px] border text-left transition-all ${
                        isMaintenance
                          ? 'opacity-40 cursor-not-allowed bg-[#f5f6fa] border-[#e2e8f0]'
                          : isSelected
                          ? 'border-[#4b3f9e] bg-[#ece9fe]/50 shadow-md cursor-pointer ring-2 ring-[#4b3f9e]/30'
                          : 'border-[rgba(201,196,212,0.7)] hover:border-[#4b3f9e] bg-white cursor-pointer shadow-sm hover:shadow'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-[14px] text-[#111c2d]">{r.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'tersedia' ? 'bg-[#d1fae5] text-[#065f46]' :
                          r.status === 'terpakai' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#fee2e2] text-[#991b1b]'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[#787583] text-[12px]">{r.gedung} · Kapasitas {r.kapasitas} orang</p>
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {fas.slice(0, 3).map(f => (
                          <span key={f} className="text-[10px] bg-[#f0f1f5] text-[#474552] px-1.5 py-0.5 rounded font-medium">
                            {f}
                          </span>
                        ))}
                        {fas.length > 3 && (
                          <span className="text-[10px] text-[#787583]">+{fas.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[13px] font-semibold text-[#111c2d] block mb-1.5">Tanggal Pelaksanaan *</label>
                <input
                  type="date"
                  value={form.tanggal}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => update('tanggal', e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#4b3f9e] focus:bg-white cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#111c2d] block mb-1.5">Jam Mulai (WIB) *</label>
                <input
                  type="time"
                  value={form.jamMulai}
                  onChange={e => update('jamMulai', e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#4b3f9e] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#111c2d] block mb-1.5">Jam Selesai (WIB) *</label>
                <input
                  type="time"
                  value={form.jamSelesai}
                  onChange={e => update('jamSelesai', e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#4b3f9e] focus:bg-white"
                />
              </div>
            </div>

            {/* Real-time Conflict & Availability Status */}
            {form.ruangan && form.tanggal && (
              <div className="rounded-[12px] p-4 border transition-all text-[13px]">
                {conflictBooking ? (
                  <div className="bg-[#fee2e2]/60 border border-[#fca5a5] text-[#991b1b] p-3 rounded-[10px] flex items-start gap-3">
                    <span className="text-[18px]">⚠️</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold">Jadwal Bentrok Terdeteksi!</span>
                      <span>
                        Ruangan <strong>{selectedRoom?.name}</strong> pada tanggal <strong>{form.tanggal}</strong> sudah dipesan untuk kegiatan <strong>"{conflictBooking.title}"</strong> ({conflictBooking.time}).
                      </span>
                      <span className="text-[12px] text-[#b91c1c] mt-1">
                        Sistem tidak memperbolehkan bentrok jadwal. Silakan sesuaikan jam sewa Anda atau pilih ruangan lain.
                      </span>
                    </div>
                  </div>
                ) : bookedSlotsOnDate.length > 0 ? (
                  <div className="bg-[#fffbeb] border border-[#fde68a] text-[#92400e] p-3 rounded-[10px] flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-bold">
                      <span>ℹ️</span> Jadwal yang telah terisi pada {form.tanggal}:
                    </div>
                    <ul className="list-disc list-inside text-[12px] space-y-0.5 pl-2">
                      {bookedSlotsOnDate.map(slot => (
                        <li key={slot.id}>
                          {slot.time}: {slot.title} ({slot.requester})
                        </li>
                      ))}
                    </ul>
                    <span className="text-[12px] text-emerald-700 font-semibold mt-1">
                      ✓ Jam pilihan Anda ({form.jamMulai} - {form.jamSelesai}) tidak bentrok dengan jadwal di atas.
                    </span>
                  </div>
                ) : (
                  <div className="bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] p-3 rounded-[10px] flex items-center gap-2">
                    <span>✅</span>
                    <span>
                      Ruangan <strong>{selectedRoom?.name}</strong> kosong sepanjang hari pada tanggal <strong>{form.tanggal}</strong>.
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-[13px] font-semibold text-[#111c2d] block mb-1.5">Estimasi Jumlah Peserta (Orang)</label>
              <input
                type="number"
                min="1"
                max={selectedRoom?.kapasitas ? String(selectedRoom.kapasitas + 50) : '500'}
                value={form.estimasiPeserta}
                onChange={e => update('estimasiPeserta', e.target.value)}
                placeholder="50"
                className="w-full sm:w-[220px] bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#4b3f9e] focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[rgba(201,196,212,0.3)]">
            <button
              onClick={() => setStep(1)}
              className="border border-[rgba(201,196,212,0.7)] text-[#474552] text-[13px] font-semibold px-4 py-2.5 rounded-[10px] hover:bg-[#f5f6fa] cursor-pointer"
            >
              ← Kembali
            </button>
            <button
              onClick={() => {
                if (!form.ruangan || !form.tanggal) {
                  setErrorMsg('Pilih ruangan dan tanggal kegiatan.');
                  return;
                }
                if (form.jamMulai >= form.jamSelesai) {
                  setErrorMsg('Jam selesai harus lebih akhir dari jam mulai.');
                  return;
                }
                if (conflictBooking) {
                  setErrorMsg('Jam yang Anda pilih bentrok dengan kegiatan lain. Silakan ubah jam.');
                  return;
                }
                setErrorMsg('');
                setStep(3);
              }}
              className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-6 py-2.5 rounded-[10px] transition-colors cursor-pointer shadow-sm flex items-center gap-2"
            >
              Lanjut: Dokumen &amp; Fasilitas →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Fasilitas, Dokumen & Review */}
      {step === 3 && (
        <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-6 lg:p-8 shadow-sm flex flex-col gap-6">
          <h2 className="text-[#111c2d] text-[18px] font-bold pb-3 border-b border-[rgba(201,196,212,0.3)] flex items-center gap-2">
            <span>📎</span> Tahap 3: Fasilitas, Lampiran Dokumen &amp; Konfirmasi
          </h2>

          <div className="flex flex-col gap-5">
            {/* Fasilitas */}
            <div>
              <label className="text-[13px] font-semibold text-[#111c2d] block mb-2">Fasilitas Tambahan yang Dibutuhkan</label>
              <div className="flex flex-wrap gap-2">
                {facilityOptions.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFasilitas(f)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer border
                      ${form.fasilitas.includes(f) ? 'bg-[#ece9fe] text-[#4b3f9e] border-[#4b3f9e] shadow-sm' : 'border-[rgba(201,196,212,0.6)] text-[#474552] hover:bg-[#f8f9fc]'}`}
                  >
                    {form.fasilitas.includes(f) ? '✓ ' : '+ '}{f}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Upload (PDF / Word) */}
            <div>
              <label className="text-[13px] font-semibold text-[#111c2d] block mb-1">
                Lampiran Proposal / Surat Izin Kegiatan (PDF atau Word)
              </label>
              <p className="text-[#787583] text-[12px] mb-2.5">
                Unggah dokumen pendukung seperti Proposal Acara atau Surat Izin Kemahasiswaan (.pdf, .doc, .docx maks. 10MB).
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[rgba(201,196,212,0.9)] hover:border-[#4b3f9e] bg-[#f8f9fc] hover:bg-[#ece9fe]/20 rounded-[12px] p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[22px]">
                    📄
                  </div>
                  <div>
                    <span className="text-[#4b3f9e] font-bold text-[13px] hover:underline">Klik untuk pilih file</span>
                    <span className="text-[#787583] text-[13px]"> atau seret file PDF / Word ke sini</span>
                  </div>
                  <span className="text-[#787583] text-[11px]">Format didukung: PDF, DOC, DOCX (Maksimal 10MB)</span>
                </div>
              ) : (
                <div className="border border-[rgba(201,196,212,0.7)] bg-[#f8f9fc] rounded-[12px] p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[8px] bg-[#ece9fe] text-[#4b3f9e] flex items-center justify-center font-bold text-[18px] shrink-0">
                      {selectedFile.name.endsWith('.pdf') ? '📕' : '📘'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[#111c2d] text-[13px] font-semibold truncate">{selectedFile.name}</span>
                      <span className="text-[#787583] text-[11px]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-[#ba1a1a] hover:bg-[#fee2e2]/60 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors cursor-pointer"
                  >
                    Hapus / Ganti
                  </button>
                </div>
              )}
            </div>

            {/* Catatan */}
            <div>
              <label className="text-[13px] font-semibold text-[#111c2d] block mb-1.5">Catatan Tambahan untuk Petugas Sarpras</label>
              <textarea
                value={form.catatan}
                onChange={e => update('catatan', e.target.value)}
                placeholder="contoh: Mohon disediakan mic wireless 2 unit dan bantuan kabel roll listrik..."
                rows={2}
                className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] p-3 text-[14px] outline-none focus:border-[#4b3f9e] focus:bg-white resize-none"
              />
            </div>

            {/* Summary preview */}
            <div className="bg-[#f8f9fc] p-5 rounded-[12px] border border-[rgba(201,196,212,0.5)] text-[13px] flex flex-col gap-2">
              <span className="font-bold text-[#111c2d] pb-1 border-b border-[rgba(201,196,212,0.3)]">
                Ringkasan Permohonan Peminjaman:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <p className="text-[#474552]"><strong>Nama Kegiatan:</strong> {form.namaKegiatan}</p>
                <p className="text-[#474552]"><strong>Organisasi:</strong> {form.organisasi}</p>
                <p className="text-[#474552]"><strong>Ruangan:</strong> {selectedRoom?.name || '-'}</p>
                <p className="text-[#474552]"><strong>Jadwal:</strong> {form.tanggal} ({form.jamMulai} - {form.jamSelesai} WIB)</p>
                <p className="text-[#474552]"><strong>Estimasi:</strong> {form.estimasiPeserta} orang</p>
                <p className="text-[#474552]">
                  <strong>Dokumen:</strong> {selectedFile ? selectedFile.name : 'Tidak melampirkan berkas'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[rgba(201,196,212,0.3)]">
            <button
              onClick={() => setStep(2)}
              className="border border-[rgba(201,196,212,0.7)] text-[#474552] text-[13px] font-semibold px-4 py-2.5 rounded-[10px] hover:bg-[#f5f6fa] cursor-pointer"
            >
              ← Kembali
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-7 py-2.5 rounded-[10px] transition-colors cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mengirim ke Server...
                </>
              ) : (
                'Kirim Pengajuan Sekarang ✓'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
