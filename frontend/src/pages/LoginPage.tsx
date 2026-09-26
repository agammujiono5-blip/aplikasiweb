import { useState } from 'react';
import type { Role } from '../components/Layout';

interface LoginPageProps {
  onLogin: (role: Role) => void;
  onNavigateRegister?: () => void;
  onNavigateForgotPassword?: () => void;
  onNavigateAdmin?: () => void;
}

export default function LoginPage({ onLogin, onNavigateRegister, onNavigateForgotPassword, onNavigateAdmin }: LoginPageProps) {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        setError(data.message || 'NIM/Email atau password salah.');
        return;
      }

      // Save token and user info to localStorage
      if (data.token) {
        localStorage.setItem('user_auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_role', 'penyewa');
      }

      onLogin('penyewa');
    } catch {
      setError('Gagal menghubungi backend API (http://localhost:8000). Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-900 select-none"
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

      {/* Glassmorphism Card - elegant frosted glass */}
      <div
        className="relative z-10 w-full max-w-[420px] sm:max-w-[440px] rounded-[32px] px-8 sm:px-10 pt-10 sm:pt-12 pb-8 sm:pb-10 border border-white/40 shadow-2xl transition-all duration-300"
        style={{
          background: 'rgba(255, 255, 255, 0.16)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* UNY SSO Brand Header - replacing 'Welcome' */}
        <div className="flex flex-col items-center mb-7">
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
          <div className="w-full border-t border-white/20 mt-3.5 pt-2.5 text-center">
            <p className="text-[11px] sm:text-[12px] font-semibold text-white/90 tracking-[0.18em] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              U N I T Y : Single Sign-on UNY
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/25 border border-red-400/40 rounded-2xl px-4 py-3 text-red-100 text-[13px] backdrop-blur-md mb-6 flex flex-col gap-2 shadow-sm">
            <div className="flex items-start gap-2.5">
              <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="block leading-snug">{error}</span>
            </div>
            {error.includes('Administrator') && (
              <button
                type="button"
                onClick={() => onNavigateAdmin ? onNavigateAdmin() : (window.location.pathname = '/admin/login')}
                className="self-start text-[12px] font-bold text-amber-200 hover:text-amber-100 underline pl-6 cursor-pointer"
              >
                Klik di sini untuk langsung ke Halaman Login Admin &rarr;
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email / NIM Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Email"
              value={credential}
              onChange={e => setCredential(e.target.value)}
              className="w-full h-[52px] rounded-full px-6 text-white placeholder-white/60 text-[14px] outline-none transition-all duration-200 border border-white/15 focus:border-white/40 focus:bg-white/[0.1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-[52px] rounded-full px-6 pr-14 text-white placeholder-white/60 text-[14px] outline-none transition-all duration-200 border border-white/15 focus:border-white/40 focus:bg-white/[0.1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer"
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

          {/* Action Button: LOGIN in Purple (Exact match with reference shape & wine-purple color) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] rounded-full text-white text-[15px] font-semibold tracking-wider uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
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
                <span>MEMVERIFIKASI...</span>
              </>
            ) : (
              'LOGIN'
            )}
          </button>

          {/* Sub Links Row: Forgot Password ? & Sign Up (Exact match with reference layout) */}
          <div className="flex items-center justify-between text-[13px] text-white/80 px-2 mt-2">
            <a
              href="/forgot-password"
              onClick={e => {
                e.preventDefault();
                if (onNavigateForgotPassword) onNavigateForgotPassword();
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Forgot Password ?
            </a>

            {onNavigateRegister ? (
              <a
                href="/register"
                onClick={e => {
                  e.preventDefault();
                  onNavigateRegister();
                }}
                className="hover:text-white font-normal transition-colors cursor-pointer"
              >
                Sign Up
              </a>
            ) : (
              <span className="hover:text-white transition-colors cursor-pointer">Sign Up</span>
            )}
          </div>

          {/* Switch to Admin Login Portal */}
          <div className="pt-3 mt-1 border-t border-white/15 flex items-center justify-center">
            <button
              type="button"
              onClick={() => onNavigateAdmin ? onNavigateAdmin() : (window.location.pathname = '/admin/login')}
              className="text-[12px] text-white/75 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1 group"
            >
              <span>Petugas / Pengelola Sarpras?</span>
              <span className="font-semibold text-amber-300 group-hover:text-amber-200 underline">Login Admin &rarr;</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
