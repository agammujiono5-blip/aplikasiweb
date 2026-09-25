import { useState } from 'react';
import type { Role } from '../components/Layout';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onRegisterSuccess: (role: Role) => void;
}

export default function RegisterPage({ onNavigateLogin, onRegisterSuccess }: RegisterPageProps) {
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMsg, setSuccessMsg] = useState('');

  // Password criteria check for Hashcat & Brute Force defense
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password && password === passwordConfirmation;

  const isPasswordStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSymbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!name || !nim || !email || !password || !passwordConfirmation) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    if (!isPasswordStrong) {
      setError('Kata sandi belum memenuhi kriteria keamanan (minimal 8 karakter, huruf besar & kecil, angka, dan simbol).');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name,
          nim,
          email,
          phone: phone || null,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setError(data.message || 'Registrasi gagal. Periksa data kembali.');
        return;
      }

      // Simpan token & data user ke localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_role', 'penyewa');
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }

      setSuccessMsg('Akun berhasil dibuat! Mengalihkan ke dashboard...');
      setTimeout(() => {
        onRegisterSuccess('penyewa');
      }, 1200);
    } catch {
      setError('Gagal terhubung ke server backend (http://localhost:8000). Pastikan backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #342586 0%, #4b3f9e 60%, #6c5ce7 100%)' }}
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-32 -left-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute bottom-10 right-8 w-28 h-28 rounded-full bg-white/8" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
              <rect x="13" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="2" y="13" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="13" y="13" width="7" height="7" rx="2" fill="white" />
            </svg>
          </div>
          <span className="text-white text-[16px] font-bold tracking-[-0.2px]">SiPinjam Kampus</span>
        </div>

        <div className="relative z-10 flex flex-col gap-5">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1.5 self-start">
            <span className="text-white text-[12px] font-semibold">🎓 Pendaftaran Mahasiswa Baru</span>
          </div>
          <h2 className="text-white text-[28px] font-bold leading-[36px] tracking-[-0.6px]">
            Bergabung untuk kemudahan peminjaman fasilitas kampus.
          </h2>
          <p className="text-white/70 text-[14px] leading-[22px]">
            Buat akun mahasiswa untuk mengajukan peminjaman ruang kelas, auditorium, laboratorium, dan peralatan kampus secara daring dan transparan.
          </p>

          <div className="flex flex-col gap-3 mt-2 bg-white/10 p-4 rounded-xl border border-white/15">
            <div className="text-white text-[13px] font-semibold flex items-center gap-2">
              <span>🛡️</span> Keamanan Tingkat Tinggi
            </div>
            <p className="text-white/70 text-[12px] leading-[18px]">
              Sistem dilindungi dari serangan SQL Injection dan password hashing standar industri (Argon2id) yang tahan terhadap Hashcat GPU cracking.
            </p>
          </div>
        </div>

        <span className="relative z-10 text-white/40 text-[11px]">Universitas Nusantara © 2024</span>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f8f9fc] px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-[480px] flex flex-col gap-5 my-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4b3f9e] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                <rect x="13" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
                <rect x="2" y="13" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
                <rect x="13" y="13" width="7" height="7" rx="2" fill="white" />
              </svg>
            </div>
            <span className="text-[#111c2d] text-[16px] font-bold">SiPinjam Kampus</span>
          </div>

          <div className="bg-white border border-[rgba(201,196,212,0.5)] rounded-[16px] p-8 shadow-[0px_4px_24px_rgba(75,63,158,0.07)]">
            <div className="flex flex-col gap-1.5 mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-[#111c2d] text-[22px] font-bold tracking-[-0.4px]">Daftar Akun Mahasiswa</h1>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-[#4b3f9e] hover:text-[#342586] text-[13px] font-semibold flex items-center gap-1"
                >
                  Masuk &rarr;
                </button>
              </div>
              <p className="text-[#787583] text-[13px]">Lengkapi data di bawah ini untuk membuat akun baru.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[#fee2e2] border border-[#fecdd3] rounded-[8px] px-4 py-3 mb-4">
                <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1 text-[#991b1b] text-[13px] leading-snug">
                  <p className="font-semibold">{error}</p>
                  {Object.keys(fieldErrors).length > 0 && (
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {Object.entries(fieldErrors).map(([key, msgs]) => (
                        <li key={key}>{msgs[0]}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 bg-[#dcfce7] border border-[#bbf7d0] rounded-[8px] px-4 py-3 mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-[#166534] text-[13px] font-semibold">{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nama Lengkap */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Pratama"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-[44px] w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                  required
                />
              </div>

              {/* NIM & Nomor Telepon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#111c2d] text-[13px] font-semibold">NIM *</label>
                  <input
                    type="text"
                    placeholder="Contoh: 2021001234"
                    value={nim}
                    onChange={e => setNim(e.target.value)}
                    className="h-[44px] w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#111c2d] text-[13px] font-semibold">No. WhatsApp/HP</label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="h-[44px] w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">Email Kampus / Aktif *</label>
                <input
                  type="email"
                  placeholder="Contoh: ahmad@kampus.ac.id"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-[44px] w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">Kata Sandi *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Kombinasi huruf besar, kecil, angka & simbol"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-[44px] w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 pr-12 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787583] hover:text-[#474552] transition-colors"
                  >
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password strength criteria checklist */}
                {password.length > 0 && (
                  <div className="bg-[#f8f9fc] border border-[rgba(201,196,212,0.5)] rounded-lg p-2.5 mt-1 text-[11px] grid grid-cols-2 gap-1.5">
                    <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                      {hasMinLength ? '✓' : '○'} Min. 8 Karakter
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                      {hasUpperCase ? '✓' : '○'} Huruf Besar (A-Z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                      {hasLowerCase ? '✓' : '○'} Huruf Kecil (a-z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasNumber && hasSymbol ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                      {hasNumber && hasSymbol ? '✓' : '○'} Angka & Simbol (#@!$)
                    </span>
                  </div>
                )}
              </div>

              {/* Konfirmasi Kata Sandi */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">Konfirmasi Kata Sandi *</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Ketik ulang kata sandi"
                    value={passwordConfirmation}
                    onChange={e => setPasswordConfirmation(e.target.value)}
                    className="h-[44px] w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 pr-12 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787583] hover:text-[#474552] transition-colors"
                  >
                    {showConfirmPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordConfirmation && !passwordsMatch && (
                  <span className="text-[12px] text-red-500 font-medium">Kata sandi tidak sama.</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordStrong || !passwordsMatch}
                className="h-[46px] w-full bg-[#4b3f9e] hover:bg-[#342586] disabled:opacity-50 text-white text-[14px] font-semibold rounded-[8px] transition-colors flex items-center justify-center gap-2 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Memproses Pendaftaran...
                  </>
                ) : 'Daftar Sekarang'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <span className="text-[13px] text-[#787583]">Sudah memiliki akun? </span>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-[#4b3f9e] font-semibold text-[13px] hover:underline"
              >
                Masuk di sini
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
