import { useState } from 'react';

interface AjukanProps {
  onNavigate: (page: string) => void;
}

const rooms = [
  { id: 'aula-a', name: 'Aula Gedung A', capacity: 300, facilities: 'Proyektor, Sound System, AC, Podium' },
  { id: 'lab-b101', name: 'Lab Komputer B-101', capacity: 40, facilities: 'PC Workstation, AC, Proyektor' },
  { id: 'seminar-c205', name: 'Ruang Seminar C-205', capacity: 80, facilities: 'Proyektor, Whiteboard, AC' },
  { id: 'rapat-dekanat', name: 'Ruang Rapat Dekanat', capacity: 20, facilities: 'TV LED, AC, Whiteboard' },
  { id: 'auditorium-rektorat', name: 'Auditorium Rektorat Lt. 3', capacity: 500, facilities: 'Proyektor, Sound System, AC, Lighting' },
  { id: 'lab-multimedia', name: 'Lab Multimedia Fasilkom', capacity: 40, facilities: 'PC Workstation, AC' },
];

const facilityOptions = ['Proyektor', 'Sound System', 'Whiteboard', 'AC', 'Lighting', 'Podium', 'Kursi Tambahan'];

type Step = 1 | 2 | 3;

export default function AjukanPeminjaman({ onNavigate }: AjukanProps) {
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
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

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleFasilitas = (f: string) => {
    setForm(prev => ({
      ...prev,
      fasilitas: prev.fasilitas.includes(f)
        ? prev.fasilitas.filter(x => x !== f)
        : [...prev.fasilitas, f],
    }));
  };

  const selectedRoom = rooms.find(r => r.id === form.ruangan);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="px-6 lg:px-8 py-6 max-w-[640px] flex flex-col items-center gap-6 mx-auto text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="w-20 h-20 rounded-full bg-[#d1fae5] flex items-center justify-center mt-8">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-[#111c2d] text-[24px] font-bold tracking-[-0.4px]">Pengajuan Terkirim!</h2>
          <p className="text-[#474552] text-[14px] leading-[22px]">
            Pengajuan peminjaman ruang untuk <strong>{form.namaKegiatan || 'kegiatan Anda'}</strong> telah berhasil dikirim.
            Nomor tiket Anda akan segera diterbitkan.
          </p>
        </div>
        <div className="bg-[rgba(240,243,255,0.8)] border border-[rgba(201,196,212,0.5)] rounded-[12px] p-5 w-full text-left flex flex-col gap-3">
          <div className="flex justify-between text-[13px]">
            <span className="text-[#787583]">Ruangan</span>
            <span className="text-[#111c2d] font-semibold">{selectedRoom?.name ?? '-'}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#787583]">Tanggal</span>
            <span className="text-[#111c2d] font-semibold">{form.tanggal}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#787583]">Waktu</span>
            <span className="text-[#111c2d] font-semibold">{form.jamMulai} – {form.jamSelesai} WIB</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#787583]">Status</span>
            <span className="bg-[#fef3c7] text-[#92400e] text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-[#fde68a]">Menunggu Verifikasi</span>
          </div>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => onNavigate('riwayat')}
            className="flex-1 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[14px] font-semibold py-3 rounded-[10px] transition-colors"
          >
            Lihat Status Pengajuan
          </button>
          <button
            onClick={() => { setSubmitted(false); setStep(1); setForm({ namaKegiatan:'',organisasi:'',jenisKegiatan:'',ruangan:'',tanggal:'',jamMulai:'',jamSelesai:'',estimasiPeserta:'',keperluan:'',fasilitas:[],catatan:'' }); }}
            className="flex-1 border border-[rgba(201,196,212,0.7)] text-[#474552] text-[14px] font-semibold py-3 rounded-[10px] hover:bg-[#f5f6fa] transition-colors"
          >
            Ajukan Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-6 max-w-[800px] flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Ajukan Peminjaman Ruang</h1>
        <p className="text-[#474552] text-[14px]">Lengkapi formulir di bawah untuk mengajukan peminjaman ruang atau peralatan.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {[{ n: 1, label: 'Informasi Kegiatan' }, { n: 2, label: 'Pilih Ruangan' }, { n: 3, label: 'Konfirmasi' }].map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all
                ${step === s.n ? 'bg-[#4b3f9e] text-white shadow-md' : step > s.n ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f0f1f5] text-[#787583]'}`}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={`text-[11px] font-medium hidden sm:block ${step === s.n ? 'text-[#4b3f9e]' : 'text-[#787583]'}`}>{s.label}</span>
            </div>
            {i < 2 && (
              <div className={`flex-1 h-[2px] mx-2 ${step > s.n ? 'bg-[#4b3f9e]' : 'bg-[rgba(201,196,212,0.5)]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-6 flex flex-col gap-5 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
          <h2 className="text-[#111c2d] text-[16px] font-semibold">Informasi Kegiatan</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-[#111c2d] text-[13px] font-semibold">Nama Kegiatan <span className="text-[#ba1a1a]">*</span></label>
              <input
                value={form.namaKegiatan}
                onChange={e => update('namaKegiatan', e.target.value)}
                placeholder="Contoh: Seminar Nasional Teknologi AI 2024"
                className="h-[44px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[#111c2d] text-[13px] font-semibold">Organisasi / UKM <span className="text-[#ba1a1a]">*</span></label>
              <input
                value={form.organisasi}
                onChange={e => update('organisasi', e.target.value)}
                placeholder="Contoh: BEM Fasilkom"
                className="h-[44px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[#111c2d] text-[13px] font-semibold">Jenis Kegiatan <span className="text-[#ba1a1a]">*</span></label>
              <select
                value={form.jenisKegiatan}
                onChange={e => update('jenisKegiatan', e.target.value)}
                className="h-[44px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
              >
                <option value="">Pilih jenis kegiatan</option>
                <option>Seminar / Webinar</option>
                <option>Pelatihan / Workshop</option>
                <option>Rapat Organisasi</option>
                <option>Ujian / Seleksi</option>
                <option>Pameran / Expo</option>
                <option>Lainnya</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[#111c2d] text-[13px] font-semibold">Estimasi Peserta <span className="text-[#ba1a1a]">*</span></label>
              <input
                type="number"
                value={form.estimasiPeserta}
                onChange={e => update('estimasiPeserta', e.target.value)}
                placeholder="Jumlah peserta"
                min="1"
                className="h-[44px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-[#111c2d] text-[13px] font-semibold">Keperluan / Deskripsi Singkat</label>
              <textarea
                value={form.keperluan}
                onChange={e => update('keperluan', e.target.value)}
                placeholder="Jelaskan keperluan penggunaan ruangan..."
                rows={3}
                className="border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 py-3 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={!form.namaKegiatan || !form.organisasi || !form.jenisKegiatan || !form.estimasiPeserta}
              className="bg-[#4b3f9e] hover:bg-[#342586] disabled:opacity-40 text-white text-[14px] font-semibold px-8 py-2.5 rounded-[8px] transition-colors"
            >
              Lanjut →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-6 flex flex-col gap-5 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
            <h2 className="text-[#111c2d] text-[16px] font-semibold">Pilih Ruangan & Waktu</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">Tanggal Kegiatan <span className="text-[#ba1a1a]">*</span></label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={e => update('tanggal', e.target.value)}
                  className="h-[44px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">Jam Mulai <span className="text-[#ba1a1a]">*</span></label>
                <input
                  type="time"
                  value={form.jamMulai}
                  onChange={e => update('jamMulai', e.target.value)}
                  className="h-[44px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">Jam Selesai <span className="text-[#ba1a1a]">*</span></label>
                <input
                  type="time"
                  value={form.jamSelesai}
                  onChange={e => update('jamSelesai', e.target.value)}
                  className="h-[44px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#111c2d] text-[13px] font-semibold">Pilih Ruangan <span className="text-[#ba1a1a]">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => update('ruangan', room.id)}
                    className={`text-left p-4 rounded-[10px] border-2 transition-all
                      ${form.ruangan === room.id
                        ? 'border-[#4b3f9e] bg-[#ece9fe]/40'
                        : 'border-[rgba(201,196,212,0.5)] hover:border-[rgba(75,63,158,0.4)] bg-white'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[#111c2d] text-[13px] font-semibold">{room.name}</span>
                      {form.ruangan === room.id && (
                        <div className="w-5 h-5 rounded-full bg-[#4b3f9e] flex items-center justify-center shrink-0">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-[#787583] text-[11px]">Kapasitas: {room.capacity} orang</span>
                    <p className="text-[#787583] text-[11px] mt-0.5">{room.facilities}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#111c2d] text-[13px] font-semibold">Fasilitas Tambahan</label>
              <div className="flex flex-wrap gap-2">
                {facilityOptions.map(f => (
                  <button
                    key={f}
                    onClick={() => toggleFasilitas(f)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all
                      ${form.fasilitas.includes(f)
                        ? 'bg-[#4b3f9e] border-[#4b3f9e] text-white'
                        : 'bg-white border-[rgba(201,196,212,0.7)] text-[#474552] hover:border-[#4b3f9e]'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-1">
            <button onClick={() => setStep(1)} className="border border-[rgba(201,196,212,0.7)] text-[#474552] text-[14px] font-semibold px-6 py-2.5 rounded-[8px] hover:bg-[#f5f6fa] transition-colors">
              ← Kembali
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!form.ruangan || !form.tanggal || !form.jamMulai || !form.jamSelesai}
              className="bg-[#4b3f9e] hover:bg-[#342586] disabled:opacity-40 text-white text-[14px] font-semibold px-8 py-2.5 rounded-[8px] transition-colors"
            >
              Lanjut →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-6 flex flex-col gap-5 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
            <h2 className="text-[#111c2d] text-[16px] font-semibold">Konfirmasi Pengajuan</h2>

            <div className="bg-[rgba(240,243,255,0.6)] border border-[rgba(201,196,212,0.4)] rounded-[10px] p-4 flex flex-col gap-3">
              {[
                { label: 'Nama Kegiatan', value: form.namaKegiatan },
                { label: 'Organisasi', value: form.organisasi },
                { label: 'Jenis Kegiatan', value: form.jenisKegiatan },
                { label: 'Ruangan', value: selectedRoom?.name ?? '-' },
                { label: 'Tanggal', value: form.tanggal },
                { label: 'Waktu', value: `${form.jamMulai} – ${form.jamSelesai} WIB` },
                { label: 'Estimasi Peserta', value: `${form.estimasiPeserta} orang` },
                { label: 'Fasilitas', value: form.fasilitas.length ? form.fasilitas.join(', ') : '-' },
              ].map(row => (
                <div key={row.label} className="flex justify-between gap-4 text-[13px] border-b border-[rgba(201,196,212,0.3)] pb-3 last:border-0 last:pb-0">
                  <span className="text-[#787583] shrink-0">{row.label}</span>
                  <span className="text-[#111c2d] font-semibold text-right">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#111c2d] text-[13px] font-semibold">Catatan Tambahan</label>
              <textarea
                value={form.catatan}
                onChange={e => update('catatan', e.target.value)}
                placeholder="Catatan tambahan untuk petugas (opsional)..."
                rows={2}
                className="border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 py-3 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white resize-none"
              />
            </div>

            <div className="flex items-start gap-3 bg-[#fef3c7] border border-[#fde68a] rounded-[8px] px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[#92400e] text-[12px] leading-relaxed">
                Pengajuan akan diproses dalam <strong>1–3 hari kerja</strong>. Pastikan semua informasi sudah benar sebelum mengirimkan.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-1">
            <button onClick={() => setStep(2)} className="border border-[rgba(201,196,212,0.7)] text-[#474552] text-[14px] font-semibold px-6 py-2.5 rounded-[8px] hover:bg-[#f5f6fa] transition-colors">
              ← Kembali
            </button>
            <button
              onClick={handleSubmit}
              className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[14px] font-semibold px-8 py-2.5 rounded-[8px] transition-colors shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
            >
              Kirim Pengajuan ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
