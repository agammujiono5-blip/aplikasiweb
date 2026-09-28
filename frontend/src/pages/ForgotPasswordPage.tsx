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
  const [debugInfo, setDebugInfo] = useState<{ mailer?: string; reset_url?: string; mail_sent?: boolean; error?: string | null } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email wajib diisi.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email);
      if (res.debug) {
        setDebugInfo(res.debug);
      }
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim permintaan. Coba lagi.';
      setError(msg);
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
            <p className="text-white text-[15px] font-semibold mb-2">Permintaan Terkirim!</p>
            <p className="text-white/80 text-[13px] leading-relaxed mb-4">
              Jika email <strong>{email}</strong> terdaftar, instruksi dan link reset password telah diproses. Periksa folder <strong>Inbox</strong> atau <strong>Spam</strong> email Anda.
            </p>

            {debugInfo?.reset_url && (
              <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl p-4 text-left mb-5">
                <div className="flex items-center gap-2 mb-1.5 text-amber-300 font-semibold text-[13px]">
                  <span>⚡</span> Link Reset Langsung (Mode {debugInfo.mailer || 'Pengujian'})
                </div>
                <p className="text-white/80 text-[12px] leading-relaxed mb-3">
                  Driver email server saat ini: <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">{debugInfo.mailer}</code>. Anda dapat langsung mengklik tombol di bawah untuk mereset password:
                </p>
                <a
                  href={debugInfo.reset_url}
                  className="block w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-[13px] rounded-full text-center transition shadow"
                >
                  Buka Halaman Reset Password ↗
                </a>
              </div>
            )}

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
