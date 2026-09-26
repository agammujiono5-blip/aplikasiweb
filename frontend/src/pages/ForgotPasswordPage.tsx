import { useState } from 'react';
import { api } from '../api/client';

interface ForgotPasswordPageProps {
  onNavigateLogin: () => void;
}

export default function ForgotPasswordPage({ onNavigateLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email wajib diisi.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Gagal mengirim permintaan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-900 select-none"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/uny-monument-hd.jpg')" }}
      />
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
            <p className="text-[11px] font-semibold text-white/90 tracking-[0.15em] uppercase">Lupa Password · SiPinjam</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-3">📧</div>
            <p className="text-white text-[15px] font-semibold mb-2">Email Terkirim!</p>
            <p className="text-white/80 text-[13px] leading-relaxed mb-6">
              Jika email <strong>{email}</strong> terdaftar, link reset password telah dikirim. Periksa inbox Anda (dan folder spam).
            </p>
            <button
              onClick={onNavigateLogin}
              className="w-full h-[48px] rounded-full bg-white text-[#4b3f9e] font-bold text-[14px] hover:bg-white/90 transition cursor-pointer"
            >
              Kembali ke Login
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/25 border border-red-400/40 rounded-2xl px-4 py-3 text-red-100 text-[13px] mb-5">
                {error}
              </div>
            )}
            <p className="text-white/80 text-[13px] text-center mb-5 leading-relaxed">
              Masukkan email akun SiPinjam Anda. Kami akan mengirimkan link untuk mereset password.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email akun Anda"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-[52px] rounded-full px-6 text-white placeholder-white/60 text-[14px] outline-none border border-white/15 focus:border-white/40 transition"
                style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-full bg-white text-[#4b3f9e] font-bold text-[15px] hover:bg-white/90 transition disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>
            <div className="mt-5 text-center">
              <button onClick={onNavigateLogin} className="text-white/70 text-[13px] hover:text-white transition cursor-pointer">
                ← Kembali ke Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
