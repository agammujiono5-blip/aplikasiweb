import { useState } from 'react';
import { api } from '../api/client';

interface ResetPasswordPageProps {
  onNavigateLogin: () => void;
}

export default function ResetPasswordPage({ onNavigateLogin }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [token] = useState(params.get('token') || '');
  const [email] = useState(params.get('email') || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) { setError('Semua kolom wajib diisi.'); return; }
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok.'); return; }
    if (!token || !email) { setError('Link reset tidak valid. Minta link baru.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.resetPassword(email, token, password, confirm);
      if (res.status === 'success') {
        setDone(true);
      } else {
        setError(res.message || 'Gagal mereset password.');
      }
    } catch {
      setError('Gagal mereset password. Token mungkin sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-900 select-none"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/uny-monument-hd.jpg')" }} />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div
        className="relative z-10 w-full max-w-[420px] rounded-[32px] px-8 pt-10 pb-8 border border-white/40 shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.16)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="flex items-center gap-3 w-full justify-center">
            <img src="/uny-logo.png" alt="Logo UNY" className="w-14 h-14 object-contain drop-shadow-md" />
            <div className="h-12 w-[1.5px] bg-white/40" />
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white leading-tight" style={{ fontFamily: "'Times New Roman', serif" }}>UNIVERSITAS</span>
              <span className="text-[13px] font-bold text-white/90 leading-tight" style={{ fontFamily: "'Times New Roman', serif" }}>NEGERI YOGYAKARTA</span>
              <div className="w-full h-[1.5px] bg-white/30 my-1" />
              <span className="text-[9px] italic text-red-200 font-semibold" style={{ fontFamily: "'Times New Roman', serif" }}>Unggul, Kreatif, dan Inovatif Berkelanjutan</span>
            </div>
          </div>
          <div className="w-full border-t border-white/20 mt-3 pt-2.5 text-center">
            <p className="text-[11px] font-semibold text-white/90 tracking-[0.15em] uppercase">Reset Password · SiPinjam</p>
          </div>
        </div>

        {done ? (
          <div className="text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-white text-[15px] font-semibold mb-2">Password Berhasil Direset!</p>
            <p className="text-white/80 text-[13px] mb-6">Silakan login dengan password baru Anda.</p>
            <button
              onClick={onNavigateLogin}
              className="w-full h-[48px] rounded-full bg-white text-[#4b3f9e] font-bold text-[14px] hover:bg-white/90 transition cursor-pointer"
            >
              Login Sekarang
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/25 border border-red-400/40 rounded-2xl px-4 py-3 text-red-100 text-[13px] mb-5">
                {error}
              </div>
            )}
            {email && (
              <p className="text-white/70 text-[12px] text-center mb-4">
                Reset password untuk: <strong className="text-white">{email}</strong>
              </p>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password baru (min. 8 karakter)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-[52px] rounded-full px-6 pr-12 text-white placeholder-white/60 text-[14px] outline-none border border-white/15 focus:border-white/40 transition"
                  style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-[12px] cursor-pointer"
                >
                  {showPass ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Konfirmasi password baru"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full h-[52px] rounded-full px-6 text-white placeholder-white/60 text-[14px] outline-none border border-white/15 focus:border-white/40 transition"
                style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-full bg-white text-[#4b3f9e] font-bold text-[15px] hover:bg-white/90 transition disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
