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
      setError('Semua kolom bertanda * wajib diisi.');
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
        localStorage.setItem('user_auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_role', 'penyewa');
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
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-900 select-none py-10"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Background: HD Universitas Negeri Yogyakarta monument photo */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: "url('/uny-monument-hd.jpg')",
          backgroundPosition: 'center center',
        }}
      />

      {/* Atmospheric neutral overlay - preserves natural sky and colors, NO purple tint */}
      <div className="absolute inset-0 bg-black/25 backdrop-brightness-[0.9] pointer-events-none" />

      {/* Glassmorphism Card */}
      <div
        className="relative z-10 w-full max-w-[460px] sm:max-w-[480px] rounded-[32px] px-8 sm:px-10 pt-9 sm:pt-11 pb-8 sm:pb-10 border border-white/40 shadow-2xl transition-all duration-300 my-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.16)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* UNY SSO Brand Header - matching Login Page */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3.5 w-full justify-center">
            {/* Official UNY Logo */}
            <img
              src="/uny-logo.png"
              alt="Logo Universitas Negeri Yogyakarta"
              className="w-16 h-16 object-contain drop-shadow-md shrink-0"
            />

            {/* Vertical Divider Line */}
            <div className="h-14 w-[1.5px] bg-white/40 shrink-0" />

            {/* University Title & Tagline */}
            <div className="flex flex-col justify-center text-left">
              <span
                className="text-[17px] sm:text-[18px] font-bold tracking-tight text-white leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                UNIVERSITAS
              </span>
              <span
                className="text-[14px] sm:text-[15px] font-bold tracking-tight text-white/95 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                NEGERI YOGYAKARTA
              </span>
              <div className="w-full h-[1.5px] bg-white/40 my-1" />
              <span
                className="text-[10px] sm:text-[11px] font-semibold italic text-red-200 tracking-tight leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                Unggul, Kreatif, dan Inovatif Berkelanjutan
              </span>
            </div>
          </div>

          {/* Single Sign-on Subtitle */}
          <div className="w-full border-t border-white/20 mt-3.5 pt-2 text-center">
            <p className="text-[11px] sm:text-[12px] font-semibold text-white/90 tracking-[0.18em] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              U N I T Y : Registrasi Mahasiswa
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/25 border border-red-400/40 rounded-2xl px-4 py-3 text-red-100 text-[13px] backdrop-blur-md mb-5 shadow-sm">
            <p className="font-semibold leading-snug">{error}</p>
            {Object.keys(fieldErrors).length > 0 && (
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[12px] text-red-200">
                {Object.entries(fieldErrors).map(([key, msgs]) => (
                  <li key={key}>{msgs[0]}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-500/25 border border-emerald-400/40 rounded-2xl px-4 py-3 text-emerald-100 text-[13px] backdrop-blur-md mb-5 flex items-center gap-2 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Nama Lengkap */}
          <div>
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full h-[48px] rounded-full px-5 text-white placeholder-white/60 text-[13px] outline-none transition-all duration-200 border border-white/15 focus:border-white/40 focus:bg-white/[0.1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
          </div>

          {/* NIM & No HP in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="NIM  (Nomor Induk Mahasiswa) "
              value={nim}
              onChange={e => setNim(e.target.value)}
              required
              className="w-full h-[48px] rounded-full px-5 text-white placeholder-white/60 text-[13px] outline-none transition-all duration-200 border border-white/15 focus:border-white/40 focus:bg-white/[0.1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
            <input
              type="text"
              placeholder="No. WhatsApp/HP"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full h-[48px] rounded-full px-5 text-white placeholder-white/60 text-[13px] outline-none transition-all duration-200 border border-white/15 focus:border-white/40 focus:bg-white/[0.1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email Kampus  (contoh@student.uny.ac.id)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-[48px] rounded-full px-5 text-white placeholder-white/60 text-[13px] outline-none transition-all duration-200 border border-white/15 focus:border-white/40 focus:bg-white/[0.1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Kata Sandi "
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full h-[48px] rounded-full px-5 pr-12 text-white placeholder-white/60 text-[13px] outline-none transition-all duration-200 border border-white/15 focus:border-white/40 focus:bg-white/[0.1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              {showPass ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Password strength checklist */}
          {password.length > 0 && (
            <div className="bg-white/[0.06] border border-white/15 rounded-2xl p-3 text-[11px] grid grid-cols-2 gap-1.5 backdrop-blur-md">
              <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-300 font-semibold' : 'text-white/50'}`}>
                {hasMinLength ? '✓' : '○'} Min. 8 Karakter
              </span>
              <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-emerald-300 font-semibold' : 'text-white/50'}`}>
                {hasUpperCase ? '✓' : '○'} Huruf Besar (A-Z)
              </span>
              <span className={`flex items-center gap-1 ${hasLowerCase ? 'text-emerald-300 font-semibold' : 'text-white/50'}`}>
                {hasLowerCase ? '✓' : '○'} Huruf Kecil (a-z)
              </span>
              <span className={`flex items-center gap-1 ${hasNumber && hasSymbol ? 'text-emerald-300 font-semibold' : 'text-white/50'}`}>
                {hasNumber && hasSymbol ? '✓' : '○'} Angka & Simbol (#@!)
              </span>
            </div>
          )}

          {/* Konfirmasi Password */}
          <div className="relative">
            <input
              type={showConfirmPass ? 'text' : 'password'}
              placeholder="Konfirmasi Kata Sandi "
              value={passwordConfirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
              required
              className="w-full h-[48px] rounded-full px-5 pr-12 text-white placeholder-white/60 text-[13px] outline-none transition-all duration-200 border border-white/15 focus:border-white/40 focus:bg-white/[0.1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              {showConfirmPass ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {passwordConfirmation && !passwordsMatch && (
            <span className="text-[11px] text-red-300 font-medium px-4">Kata sandi tidak cocok.</span>
          )}

          {/* Submit Button in Purple */}
          <button
            type="submit"
            disabled={loading || !isPasswordStrong || !passwordsMatch}
            className="w-full h-[50px] rounded-full text-white text-[14px] font-semibold tracking-wider uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            style={{
              background: 'linear-gradient(135deg, #7c2d82 0%, #581c87 100%)',
              boxShadow: '0 8px 24px rgba(88, 28, 135, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span>MEMPROSES PENDAFTARAN...</span>
              </>
            ) : (
              'DAFTAR SEKARANG'
            )}
          </button>
        </form>

        {/* Bottom login link */}
        <div className="mt-5 text-center">
          <span className="text-[13px] text-white/80">Sudah memiliki akun? </span>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-white hover:text-purple-200 font-semibold text-[13px] underline-offset-4 hover:underline cursor-pointer"
          >
            Masuk di sini &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
