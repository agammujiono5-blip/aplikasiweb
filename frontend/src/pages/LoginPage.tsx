import { useEffect, useState } from 'react';
import type { Role } from '../components/Layout';

interface LoginPageProps {
  onLogin: (role: Role) => void;
  onNavigateRegister?: () => void;
}

export default function LoginPage({ onLogin, onNavigateRegister }: LoginPageProps) {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Timer countdown for Rate Limiter lockout (5 attempts -> 2 min / 120s)
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleUseDemo = () => {
    setCredential('2021001234');
    setPassword('Mahasiswa#2024!');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!credential || !password) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ credential, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const waitTime = Number(data.retry_after_seconds) || 120;
          setLockoutSeconds(waitTime);
          setError(data.message || `Percobaan login melebihi batas (5 kali). Sistem mengunci akses Anda selama ${formatLockoutTime(waitTime)}.`);
          setRemainingAttempts(0);
        } else if (response.status === 401) {
          setError(data.message || 'NIM/Email atau kata sandi tidak sesuai.');
          if (data.remaining_attempts !== undefined) {
            setRemainingAttempts(data.remaining_attempts);
          }
        } else if (response.status === 403) {
          setError(data.message || 'Akun Anda dinonaktifkan oleh administrator. Silakan hubungi IT Support.');
        } else if (response.status === 422) {
          let msg = data.message || 'Data yang dimasukkan tidak valid.';
          if (data.errors) {
            const firstErr = Object.values(data.errors).flat()[0];
            if (typeof firstErr === 'string') msg = firstErr;
          }
          setError(msg);
        } else if (response.status >= 500) {
          setError(data.message || 'Terjadi kesalahan pada server backend (500). Silakan coba lagi nanti.');
        } else {
          setError(data.message || 'Login gagal. Periksa kembali kredensial Anda.');
        }
        return;
      }

      // Simpan autentikasi ke localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_role', 'penyewa');
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }

      setRemainingAttempts(null);
      onLogin('penyewa');
    } catch {
      setError('Gagal menghubungi backend API (http://localhost:8000). Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #342586 0%, #4b3f9e 60%, #6c5ce7 100%)',
        }}
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
            <span className="text-white text-[12px] font-semibold">🎓 Portal Mahasiswa</span>
          </div>
          <h2 className="text-white text-[28px] font-bold leading-[36px] tracking-[-0.6px]">
            Kelola peminjaman ruang dengan mudah & transparan.
          </h2>
          <p className="text-white/60 text-[14px] leading-[22px]">
            Pantau status pengajuan, terima notifikasi real-time, dan unduh surat izin langsung dari dashboard.
          </p>

          <div className="flex flex-col gap-3 mt-2">
            {[
              { icon: '🏢', label: 'Peminjaman ruang & peralatan kampus' },
              { icon: '⚡', label: 'Proses verifikasi otomatis & cepat' },
              { icon: '📄', label: 'Unduh surat izin dalam format PDF' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-[15px] shrink-0">
                  {item.icon}
                </div>
                <span className="text-white/80 text-[13px]">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Security feature banner */}
          <div className="bg-white/10 p-3 rounded-lg border border-white/10 text-[11px] text-white/70">
            🔒 Dilengkapi proteksi SQL Injection, Argon2id Hashcat defense, dan Rate Limiting (5x gagal lockout 2 menit).
          </div>
        </div>

        <span className="relative z-10 text-white/30 text-[11px]">Universitas Nusantara © 2024</span>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f8f9fc] px-6 py-8">
        <div className="w-full max-w-[420px] flex flex-col gap-5">
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
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-[#111c2d] text-[22px] font-bold tracking-[-0.4px]">
                  Masuk sebagai Mahasiswa
                </h1>
                <button
                  type="button"
                  onClick={handleUseDemo}
                  className="text-[11px] font-semibold bg-[#f0f1f5] hover:bg-[#e4e5eb] text-[#4b3f9e] px-2.5 py-1 rounded-md transition-colors"
                >
                  Isi Demo
                </button>
              </div>
              <p className="text-[#787583] text-[13px]">
                Gunakan NIM atau Email dan kata sandi.
              </p>
            </div>

            {/* Lockout alert */}
            {lockoutSeconds > 0 && (
              <div className="flex items-center gap-3 bg-[#fef2f2] border-2 border-[#ef4444] rounded-[10px] p-4 mb-4 animate-pulse">
                <div className="text-[24px]">⏳</div>
                <div>
                  <div className="text-[#b91c1c] text-[13px] font-bold">Akses Dikunci Sementara!</div>
                  <div className="text-[#7f1d1d] text-[12px] mt-0.5">
                    5 kali gagal berturut-turut. Tunggu <span className="font-mono font-bold text-red-600">{formatLockoutTime(lockoutSeconds)}</span> sebelum mencoba lagi.
                  </div>
                </div>
              </div>
            )}

            {/* Error & Remaining attempts */}
            {error && lockoutSeconds === 0 && (
              <div className="flex items-start gap-2 bg-[#fee2e2] border border-[#fecdd3] rounded-[8px] px-4 py-3 mb-4">
                <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1">
                  <span className="text-[#991b1b] text-[13px] block">{error}</span>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <span className="text-[#b91c1c] text-[11px] font-semibold block mt-1">
                      ⚠️ Sisa percobaan sebelum akun dikunci 2 menit: {remainingAttempts} kali
                    </span>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">
                  NIM atau Email
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2021001234"
                  value={credential}
                  onChange={e => setCredential(e.target.value)}
                  disabled={lockoutSeconds > 0}
                  className="h-[46px] w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white disabled:bg-gray-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#111c2d] text-[13px] font-semibold">Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={lockoutSeconds > 0}
                    className="h-[46px] w-full border border-[rgba(201,196,212,0.7)] rounded-[8px] px-4 pr-12 text-[14px] text-[#111c2d] placeholder-[#b0acba] outline-none focus:border-[#4b3f9e] focus:ring-2 focus:ring-[#4b3f9e]/10 transition-all bg-white disabled:bg-gray-100"
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
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#4b3f9e]" />
                  <span className="text-[#474552] text-[13px]">Ingat saya</span>
                </label>
                <button type="button" className="text-[#4b3f9e] text-[13px] font-semibold hover:underline">
                  Lupa kata sandi?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || lockoutSeconds > 0}
                className="h-[46px] w-full bg-[#4b3f9e] hover:bg-[#342586] disabled:opacity-50 text-white text-[14px] font-semibold rounded-[8px] transition-colors flex items-center justify-center gap-2 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] mt-1"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Memverifikasi kredensial...
                  </>
                ) : lockoutSeconds > 0 ? (
                  `Terkunci (${formatLockoutTime(lockoutSeconds)})`
                ) : (
                  'Masuk sebagai Mahasiswa'
                )}
              </button>
            </form>

            {/* Register link for mahasiswa */}
            {onNavigateRegister && (
              <div className="mt-5 pt-4 border-t border-[rgba(201,196,212,0.4)] text-center">
                <span className="text-[13px] text-[#787583]">Belum punya akun mahasiswa? </span>
                <a
                  href="/register"
                  onClick={e => {
                    e.preventDefault();
                    onNavigateRegister();
                  }}
                  className="text-[#4b3f9e] font-semibold text-[13px] hover:underline cursor-pointer"
                >
                  Daftar sekarang
                </a>
              </div>
            )}
          </div>

          <p className="text-center text-[12px] text-[#787583]">
            Butuh bantuan?{' '}
            <a href="#" className="text-[#4b3f9e] font-semibold hover:underline">
              Hubungi IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
