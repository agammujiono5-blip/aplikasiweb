import { useEffect, useState, useRef } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
  isReady?: boolean;
}

export default function LoadingScreen({ onComplete, isReady = false }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        // If auth is already ready, advance quickly towards 100%
        if (isReadyRef.current) {
          if (prev >= 100) {
            clearInterval(timer);
            setFadeOut(true);
            setTimeout(() => onCompleteRef.current(), 300);
            return 100;
          }
          return Math.min(100, prev + 10);
        }

        // If auth is still validating, smoothly advance up to 90% and wait
        if (prev < 90) {
          return prev + 3;
        }
        return 90;
      });
    }, 30);

    // Safety timeout: in case network never resolves, force complete after 4 seconds
    const safetyTimeout = setTimeout(() => {
      setProgress(100);
      setFadeOut(true);
      setTimeout(() => onCompleteRef.current(), 300);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearTimeout(safetyTimeout);
    };
  }, []);

  // When isReady flips to true from outside, immediately accelerate progress to 100%
  useEffect(() => {
    if (isReady && progress < 100) {
      const fastInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(fastInterval);
            setFadeOut(true);
            setTimeout(() => onCompleteRef.current(), 300);
            return 100;
          }
          return Math.min(100, prev + 15);
        });
      }, 25);
      return () => clearInterval(fastInterval);
    }
  }, [isReady]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-900 select-none"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
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

      {/* Glassmorphism Card - elegant frosted glass matching Login & Register */}
      <div
        className="relative z-10 w-full max-w-[420px] sm:max-w-[440px] rounded-[32px] px-8 sm:px-10 pt-10 sm:pt-12 pb-9 sm:pb-11 border border-white/40 shadow-2xl transition-all duration-300 flex flex-col items-center"
        style={{
          background: 'rgba(255, 255, 255, 0.16)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* UNY SSO Brand Header */}
        <div className="flex flex-col items-center mb-7 w-full">
          <div className="flex items-center gap-3.5 w-full justify-center">
            {/* Official UNY Logo */}
            <img
              src="/uny-logo.png"
              alt="Logo Universitas Negeri Yogyakarta"
              className="w-16 h-16 object-contain drop-shadow-md shrink-0 animate-pulse"
              style={{ animationDuration: '3s' }}
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

        {/* Loading Progress Section */}
        <div className="w-full flex flex-col gap-4 mt-2">
          {/* Status text & percentage */}
          <div className="flex items-center justify-between text-white/90 text-[13px] px-1 font-medium">
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-purple-300 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Memuat Layanan Sistem...</span>
            </div>
            <span className="tabular-nums font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {progress}%
            </span>
          </div>

          {/* Progress bar with glowing purple accent */}
          <div
            className="w-full h-[7px] rounded-full overflow-hidden p-[1px] border border-white/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-100 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7c3aed 0%, #9333ea 50%, #c084fc 100%)',
                boxShadow: '0 0 14px rgba(168, 85, 247, 0.8), 0 0 4px rgba(255, 255, 255, 0.6)',
              }}
            />
          </div>

          {/* Information badge */}
          <div className="text-center mt-2">
            <span className="text-[11.5px] text-white/70 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              Sistem Informasi Peminjaman Sarana & Prasarana
            </span>
          </div>
        </div>
      </div>

      {/* Subtle bottom copyright */}
      <div className="absolute bottom-6 text-center pointer-events-none">
        <span className="text-white/40 text-[11px] tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
          Universitas Negeri Yogyakarta © 2026
        </span>
      </div>
    </div>
  );
}
