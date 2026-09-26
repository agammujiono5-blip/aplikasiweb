import { useState } from 'react';
import { api, useLiveQuery, broadcastUpdate } from '../../api/client';
import type { UserProfileData } from '../../api/client';

interface ProfilProps {
  onLogout: () => void;
}

const getInitialProfile = (): UserProfileData => {
  try {
    const raw = localStorage.getItem('user_data');
    if (raw) {
      const u = JSON.parse(raw);
      return {
        id: u.id || 1,
        nama: u.name || u.nama || 'Mahasiswa',
        nim: u.nim || '',
        email: u.email || '',
        phone: u.phone || u.noHp || '',
        noHp: u.phone || u.noHp || '',
        prodi: u.prodi || '',
        fakultas: u.fakultas || '',
        angkatan: u.angkatan || '',
        organisasi: u.organisasi || '',
        jabatan: u.jabatan || '',
        alamat: u.alamat || '',
        bio: u.bio || '',
        is_active: u.is_active ?? true,
      };
    }
  } catch {
    // ignore
  }
  return {
    id: 1,
    nama: 'Mahasiswa',
    nim: '',
    email: '',
    phone: '',
    noHp: '',
    prodi: '',
    fakultas: '',
    angkatan: '',
    organisasi: '',
    jabatan: '',
    alamat: '',
    bio: '',
    is_active: true,
  };
};

export default function ProfilSaya({ onLogout }: ProfilProps) {
  const { data: dbProfile, loading, refetch } = useLiveQuery(() => api.users.getProfile());

  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>(getInitialProfile);
  const [temp, setTemp] = useState<UserProfileData>(getInitialProfile);
  const [changePassMode, setChangePassMode] = useState(false);
  const [pass, setPass] = useState({ lama: '', baru: '', konfirmasi: '' });
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevDbProfile, setPrevDbProfile] = useState(dbProfile);

  if (dbProfile !== prevDbProfile) {
    setPrevDbProfile(dbProfile);
    if (dbProfile) {
      setProfile(dbProfile);
      setTemp(dbProfile);
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true);
    setMsg(null);
    try {
      const updatePayload: Record<string, string> = {
        nama: temp.nama,
        nim: temp.nim,
        phone: temp.phone || temp.noHp,
        prodi: temp.prodi,
        fakultas: temp.fakultas,
        angkatan: temp.angkatan,
        organisasi: temp.organisasi,
        jabatan: temp.jabatan || '',
        alamat: temp.alamat || '',
        bio: temp.bio || '',
      };

      if (changePassMode && pass.baru) {
        if (pass.baru !== pass.konfirmasi) {
          setMsg({ text: 'Konfirmasi kata sandi baru tidak cocok.', error: true });
          setIsSubmitting(false);
          return;
        }
        updatePayload.password_lama = pass.lama;
        updatePayload.password_baru = pass.baru;
      }

      const res = await api.users.updateProfile(updatePayload);

      // Update local storage user data
      const stored = localStorage.getItem('user_data');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('user_data', JSON.stringify({
          ...u,
          name: temp.nama,
          nama: temp.nama,
          nim: temp.nim,
          phone: temp.phone || temp.noHp,
          prodi: temp.prodi,
          fakultas: temp.fakultas,
          angkatan: temp.angkatan,
          organisasi: temp.organisasi,
          jabatan: temp.jabatan,
          alamat: temp.alamat,
          bio: temp.bio,
        }));
      }

      broadcastUpdate();
      setProfile(res.data);
      setEditMode(false);
      setChangePassMode(false);
      setPass({ lama: '', baru: '', konfirmasi: '' });
      setMsg({ text: 'Profil berhasil diperbarui dan disinkronisasi!' });
      await refetch();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : String(err), error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = profile.nama
    ? profile.nama.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'M';

  return (
    <div className="px-6 lg:px-10 py-6 w-full max-w-full flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[#111c2d] text-[28px] lg:text-[32px] font-bold tracking-[-0.8px]">Profil Saya</h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mt-1" />
          </div>
          <p className="text-[#474552] text-[14px]">
            Kelola informasi data diri, identitas akademik, kontak, dan keamanan akun peminjam secara real-time.
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-[#787583] bg-white border border-[rgba(201,196,212,0.4)] px-3 py-1.5 rounded-full w-fit">
            <div className="w-3.5 h-3.5 border-2 border-[#4b3f9e] border-t-transparent rounded-full animate-spin" />
            Sinkronisasi database...
          </div>
        )}
      </div>

      {msg && (
        <div className={`p-4 rounded-[12px] text-[13px] font-medium border flex items-center justify-between ${
          msg.error ? 'bg-[#fee2e2] text-[#991b1b] border-[#fecdd3]' : 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-current opacity-70 hover:opacity-100 text-[16px] font-bold">×</button>
        </div>
      )}

      {/* Hero Profile Card */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-6 lg:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#ece9fe] to-[#c7c4d4] flex items-center justify-center text-[#4b3f9e] text-[32px] font-bold shrink-0 shadow-inner">
          {initials}
        </div>
        <div className="flex-1 text-center sm:text-left flex flex-col gap-1.5 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[#111c2d] text-[22px] lg:text-[24px] font-bold">{profile.nama || 'Mahasiswa'}</h2>
              <p className="text-[#787583] text-[13px] font-medium">
                {profile.nim ? `NIM: ${profile.nim}` : 'NIM belum diatur'} {profile.prodi ? `· ${profile.prodi}` : ''}
              </p>
            </div>
            {!editMode && (
              <button
                onClick={() => { setTemp({ ...profile }); setEditMode(true); }}
                className="self-center sm:self-start bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profil
              </button>
            )}
          </div>

          <p className="text-[#474552] text-[13px] mt-1">{profile.email}</p>

          <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
            <span className="bg-[#ece9fe] text-[#4b3f9e] text-[11px] font-bold px-3 py-1 rounded-full">
              🎓 Mahasiswa Aktif
            </span>
            {profile.angkatan && (
              <span className="bg-[#d1fae5] text-[#065f46] text-[11px] font-bold px-3 py-1 rounded-full">
                Angkatan {profile.angkatan}
              </span>
            )}
            {profile.fakultas && (
              <span className="bg-[#f5f6fa] text-[#474552] border border-[rgba(201,196,212,0.5)] text-[11px] font-semibold px-3 py-1 rounded-full">
                🏛️ {profile.fakultas}
              </span>
            )}
            {profile.organisasi && (
              <span className="bg-[#fef3c7] text-[#92400e] text-[11px] font-bold px-3 py-1 rounded-full">
                👥 {profile.organisasi} {profile.jabatan ? `(${profile.jabatan})` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data Akademik & Identitas (2 spans) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-6 lg:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(201,196,212,0.3)]">
              <h3 className="text-[#111c2d] text-[17px] font-bold flex items-center gap-2">
                <span>📋</span> Data Pribadi &amp; Akademik
              </h3>
              {editMode && (
                <span className="text-[12px] text-[#4b3f9e] font-semibold bg-[#ece9fe] px-2.5 py-0.5 rounded-full">
                  Mode Edit Aktif
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[13px]">
              <div>
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Nama Lengkap</label>
                {editMode ? (
                  <input
                    type="text"
                    value={temp.nama}
                    onChange={e => setTemp(p => ({ ...p, nama: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-medium"
                    placeholder="Contoh: Agam Mujiono"
                  />
                ) : (
                  <p className="text-[#111c2d] font-semibold py-1">{profile.nama || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Nomor Induk Mahasiswa (NIM)</label>
                {editMode ? (
                  <input
                    type="text"
                    value={temp.nim}
                    onChange={e => setTemp(p => ({ ...p, nim: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-mono font-medium"
                    placeholder="Contoh: 21537144001"
                  />
                ) : (
                  <p className="text-[#111c2d] font-semibold font-mono py-1">{profile.nim || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Email Kampus / Akun</label>
                <p className="text-[#111c2d] font-semibold py-1">{profile.email || '-'}</p>
              </div>

              <div>
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Nomor WhatsApp / HP</label>
                {editMode ? (
                  <input
                    type="text"
                    value={temp.phone || temp.noHp}
                    onChange={e => setTemp(p => ({ ...p, phone: e.target.value, noHp: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-medium"
                    placeholder="Contoh: 08123456789"
                  />
                ) : (
                  <p className="text-[#111c2d] font-semibold py-1">{profile.phone || profile.noHp || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Program Studi (Prodi)</label>
                {editMode ? (
                  <input
                    type="text"
                    value={temp.prodi}
                    onChange={e => setTemp(p => ({ ...p, prodi: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-medium"
                    placeholder="Contoh: Teknik Informatika / Pendidikan Teknik"
                  />
                ) : (
                  <p className="text-[#111c2d] font-semibold py-1">{profile.prodi || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Fakultas</label>
                {editMode ? (
                  <input
                    type="text"
                    value={temp.fakultas}
                    onChange={e => setTemp(p => ({ ...p, fakultas: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-medium"
                    placeholder="Contoh: Fakultas Teknik"
                  />
                ) : (
                  <p className="text-[#111c2d] font-semibold py-1">{profile.fakultas || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Tahun Angkatan</label>
                {editMode ? (
                  <input
                    type="text"
                    value={temp.angkatan}
                    onChange={e => setTemp(p => ({ ...p, angkatan: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-medium"
                    placeholder="Contoh: 2022"
                  />
                ) : (
                  <p className="text-[#111c2d] font-semibold py-1">{profile.angkatan || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Organisasi / UKM</label>
                {editMode ? (
                  <input
                    type="text"
                    value={temp.organisasi}
                    onChange={e => setTemp(p => ({ ...p, organisasi: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-medium"
                    placeholder="Contoh: HIMA / BEM / UKM Musik"
                  />
                ) : (
                  <p className="text-[#111c2d] font-semibold py-1">{profile.organisasi || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Jabatan di Organisasi</label>
                {editMode ? (
                  <input
                    type="text"
                    value={temp.jabatan || ''}
                    onChange={e => setTemp(p => ({ ...p, jabatan: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-medium"
                    placeholder="Contoh: Ketua / Sekretaris / Koordinator Sie"
                  />
                ) : (
                  <p className="text-[#111c2d] font-semibold py-1">{profile.jabatan || '-'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Alamat / Domisili Mahasiswa</label>
                {editMode ? (
                  <input
                    type="text"
                    value={temp.alamat || ''}
                    onChange={e => setTemp(p => ({ ...p, alamat: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-medium"
                    placeholder="Contoh: Karangmalang, Sleman, D.I. Yogyakarta"
                  />
                ) : (
                  <p className="text-[#111c2d] font-semibold py-1">{profile.alamat || '-'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-[#787583] text-[12px] font-medium block mb-1.5">Bio / Informasi Tambahan</label>
                {editMode ? (
                  <textarea
                    rows={2}
                    value={temp.bio || ''}
                    onChange={e => setTemp(p => ({ ...p, bio: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#4b3f9e] focus:bg-white transition-all text-[#111c2d] font-medium resize-none"
                    placeholder="Tuliskan catatan singkat tentang aktivitas atau profil Anda..."
                  />
                ) : (
                  <p className="text-[#474552] text-[13px] py-1">{profile.bio || 'Belum ada bio yang ditambahkan.'}</p>
                )}
              </div>
            </div>

            {editMode && (
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-[rgba(201,196,212,0.3)]">
                <button
                  onClick={() => { setEditMode(false); setChangePassMode(false); }}
                  className="border border-[rgba(201,196,212,0.7)] text-[#474552] text-[13px] font-semibold px-4 py-2.5 rounded-[10px] hover:bg-[#f5f6fa] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold px-6 py-2.5 rounded-[10px] transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Keamanan Akun & Ringkasan (1 span) */}
        <div className="flex flex-col gap-6">
          {/* Keamanan & Kata Sandi */}
          <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-[#111c2d] text-[17px] font-bold pb-2 border-b border-[rgba(201,196,212,0.3)] flex items-center gap-2">
              <span>🔒</span> Keamanan Akun
            </h3>

            {!changePassMode ? (
              <div className="flex flex-col gap-3">
                <p className="text-[#787583] text-[13px]">
                  Amankan akun Anda dengan rutin mengganti kata sandi secara berkala.
                </p>
                <button
                  onClick={() => setChangePassMode(true)}
                  className="w-full border border-[rgba(201,196,212,0.7)] text-[#474552] hover:bg-[#f5f6fa] text-[13px] font-semibold py-2.5 rounded-[10px] transition-colors cursor-pointer"
                >
                  Ubah Kata Sandi
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-[13px]">
                <div>
                  <label className="text-[#787583] text-[12px] block mb-1">Kata Sandi Lama</label>
                  <input
                    type="password"
                    placeholder="Masukkan kata sandi lama"
                    value={pass.lama}
                    onChange={e => setPass(p => ({ ...p, lama: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[#787583] text-[12px] block mb-1">Kata Sandi Baru (min. 8 karakter)</label>
                  <input
                    type="password"
                    placeholder="Masukkan kata sandi baru"
                    value={pass.baru}
                    onChange={e => setPass(p => ({ ...p, baru: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[#787583] text-[12px] block mb-1">Konfirmasi Kata Sandi Baru</label>
                  <input
                    type="password"
                    placeholder="Ulangi kata sandi baru"
                    value={pass.konfirmasi}
                    onChange={e => setPass(p => ({ ...p, konfirmasi: e.target.value }))}
                    className="w-full bg-[#f8f9fc] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 py-2 outline-none focus:border-[#4b3f9e] focus:bg-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setChangePassMode(false); setPass({ lama: '', baru: '', konfirmasi: '' }); }}
                    className="flex-1 border border-[rgba(201,196,212,0.7)] text-[#474552] text-[13px] font-semibold py-2 rounded-[8px] hover:bg-[#f5f6fa] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting || !pass.lama || !pass.baru}
                    className="flex-1 bg-[#4b3f9e] hover:bg-[#342586] text-white text-[13px] font-semibold py-2 rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sesi & Logout */}
          <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-6 shadow-sm flex flex-col gap-3">
            <h4 className="text-[#111c2d] text-[15px] font-bold">Sesi Peminjam</h4>
            <p className="text-[#787583] text-[12px]">
              Keluar dari akun Anda jika menggunakan komputer publik atau perangkat bersama di lingkungan kampus.
            </p>
            <button
              onClick={onLogout}
              className="w-full border border-[#fecdd3] text-[#ba1a1a] hover:bg-[#fee2e2]/40 text-[13px] font-semibold py-2.5 rounded-[10px] transition-colors cursor-pointer flex items-center justify-center gap-2 mt-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Keluar dari Sesi Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
