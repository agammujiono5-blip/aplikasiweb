import { useState } from 'react';

interface ProfilProps {
  onLogout: () => void;
}

export default function ProfilSaya({ onLogout }: ProfilProps) {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    nama: 'Rizky Dharma Pratama',
    nim: '2021001234',
    email: 'rizky.dharma@mahasiswa.nusantara.ac.id',
    prodi: 'Teknik Informatika',
    fakultas: 'Fakultas Ilmu Komputer',
    angkatan: '2021',
    noHp: '081234567890',
    organisasi: 'BEM Fasilkom',
  });
  const [temp, setTemp] = useState({ ...profile });
  const [changePassMode, setChangePassMode] = useState(false);
  const [pass, setPass] = useState({ lama: '', baru: '', konfirmasi: '' });
  const [notif, setNotif] = useState({ email: true, whatsapp: false, push: true });

  const handleSave = () => {
    setProfile({ ...temp });
    setEditMode(false);
  };

  return (
    <div className="px-6 lg:px-8 py-6 max-w-[800px] flex flex-col gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-[#111c2d] text-[28px] font-bold tracking-[-0.6px]">Profil Saya</h1>
        <p className="text-[#474552] text-[14px]">Kelola informasi akun dan preferensi notifikasi Anda.</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-6 shadow-[0px_1px_3px_rgba(30,41,59,0.04)] flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-[#ece9fe] flex items-center justify-center text-[#4b3f9e] text-[28px] font-bold">
            RD
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#4b3f9e] border-2 border-white flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left flex flex-col gap-1">
          <h2 className="text-[#111c2d] text-[20px] font-bold">{profile.nama}</h2>
          <p className="text-[#787583] text-[13px]">{profile.nim} · {profile.prodi}</p>
          <p className="text-[#787583] text-[13px]">{profile.email}</p>
          <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
            <span className="bg-[#ece9fe] text-[#4b3f9e] text-[11px] font-semibold px-2.5 py-1 rounded-full">Mahasiswa Aktif</span>
            <span className="bg-[#d1fae5] text-[#065f46] text-[11px] font-semibold px-2.5 py-1 rounded-full">Angkatan {profile.angkatan}</span>
          </div>
        </div>
        {!editMode && (
          <button
            onClick={() => { setTemp({ ...profile }); setEditMode(true); }}
            className="shrink-0 border border-[rgba(201,196,212,0.7)] text-[#474552] text-[13px] font-semibold px-4 py-2 rounded-[8px] hover:bg-[#f5f6fa] transition-colors flex items-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Edit Profil
          </button>
        )}
      </div>

      {/* Info form */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-6 flex flex-col gap-5 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[#111c2d] text-[15px] font-semibold">Informasi Akun</h3>
          {editMode && (
            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)} className="text-[#787583] text-[13px] font-semibold px-3 py-1.5 rounded-[8px] hover:bg-[#f5f6fa] transition-colors">Batal</button>
              <button onClick={handleSave} className="bg-[#4b3f9e] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] hover:bg-[#342586] transition-colors">Simpan</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'nama', label: 'Nama Lengkap', editable: true },
            { key: 'nim', label: 'NIM', editable: false },
            { key: 'email', label: 'Email Kampus', editable: false },
            { key: 'noHp', label: 'No. HP / WhatsApp', editable: true },
            { key: 'prodi', label: 'Program Studi', editable: false },
            { key: 'fakultas', label: 'Fakultas', editable: false },
            { key: 'angkatan', label: 'Angkatan', editable: false },
            { key: 'organisasi', label: 'Organisasi', editable: true },
          ].map(field => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-[#111c2d] text-[12px] font-semibold">{field.label}</label>
              {editMode && field.editable ? (
                <input
                  value={temp[field.key as keyof typeof temp]}
                  onChange={e => setTemp(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="h-[40px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 text-[13px] text-[#111c2d] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                />
              ) : (
                <div className={`h-[40px] flex items-center px-3 rounded-[8px] text-[13px] ${!field.editable ? 'bg-[#f8f9fc] text-[#787583]' : 'text-[#111c2d]'}`}>
                  {profile[field.key as keyof typeof profile]}
                  {!field.editable && <span className="ml-2 text-[10px] bg-[#f0f1f5] text-[#787583] px-1.5 py-0.5 rounded">Tidak dapat diubah</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-6 flex flex-col gap-4 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
        <h3 className="text-[#111c2d] text-[15px] font-semibold">Preferensi Notifikasi</h3>
        {[
          { key: 'email', label: 'Notifikasi Email', desc: 'Terima update status pengajuan melalui email kampus' },
          { key: 'whatsapp', label: 'Notifikasi WhatsApp', desc: 'Terima notifikasi melalui WhatsApp' },
          { key: 'push', label: 'Notifikasi Push', desc: 'Terima notifikasi push di browser' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[#111c2d] text-[13px] font-semibold">{item.label}</span>
              <span className="text-[#787583] text-[12px]">{item.desc}</span>
            </div>
            <button
              onClick={() => setNotif(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${notif[item.key as keyof typeof notif] ? 'bg-[#4b3f9e]' : 'bg-[rgba(201,196,212,0.6)]'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notif[item.key as keyof typeof notif] ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Change password */}
      <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[12px] p-6 flex flex-col gap-4 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[#111c2d] text-[15px] font-semibold">Keamanan Akun</h3>
          <button
            onClick={() => setChangePassMode(!changePassMode)}
            className="text-[#4b3f9e] text-[13px] font-semibold hover:underline"
          >
            {changePassMode ? 'Batal' : 'Ubah Kata Sandi'}
          </button>
        </div>
        {!changePassMode && (
          <p className="text-[#787583] text-[13px]">Kata sandi terakhir diubah 30 hari lalu. Disarankan mengubah kata sandi secara berkala.</p>
        )}
        {changePassMode && (
          <div className="grid grid-cols-1 gap-3">
            {[
              { key: 'lama', label: 'Kata Sandi Lama' },
              { key: 'baru', label: 'Kata Sandi Baru' },
              { key: 'konfirmasi', label: 'Konfirmasi Kata Sandi Baru' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[12px] font-semibold">{f.label}</label>
                <input
                  type="password"
                  value={pass[f.key as keyof typeof pass]}
                  onChange={e => setPass(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="h-[40px] border border-[rgba(201,196,212,0.7)] rounded-[8px] px-3 text-[13px] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                />
              </div>
            ))}
            <button className="bg-[#4b3f9e] text-white text-[13px] font-semibold py-2.5 rounded-[8px] hover:bg-[#342586] transition-colors mt-1">
              Simpan Kata Sandi Baru
            </button>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-[#fecdd3] rounded-[12px] p-6 flex flex-col gap-3 shadow-[0px_1px_3px_rgba(30,41,59,0.04)]">
        <h3 className="text-[#991b1b] text-[15px] font-semibold">Keluar dari Akun</h3>
        <p className="text-[#787583] text-[13px]">Anda akan keluar dari semua sesi aktif di perangkat ini.</p>
        <button
          onClick={onLogout}
          className="self-start flex items-center gap-2 bg-[#fee2e2] hover:bg-[#fecdd3] text-[#991b1b] text-[13px] font-semibold px-4 py-2 rounded-[8px] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Keluar Sekarang
        </button>
      </div>
    </div>
  );
}
