import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(onComplete, 500);
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#4b3f9e]"
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-[72px] h-[72px] rounded-[20px] bg-white/20 border border-white/30 flex items-center justify-center">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect x="4" y="4" width="13" height="13" rx="3" fill="white"/>
              <rect x="21" y="4" width="13" height="13" rx="3" fill="white" fillOpacity="0.6"/>
              <rect x="4" y="21" width="13" height="13" rx="3" fill="white" fillOpacity="0.6"/>
              <rect x="21" y="21" width="13" height="13" rx="3" fill="white"/>
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span
              className="text-white text-[22px] font-bold tracking-[-0.4px]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              SiPinjam Kampus
            </span>
            <span
              className="text-white/60 text-[13px] font-normal"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Sistem Peminjaman Ruang & Peralatan
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-[220px] flex flex-col gap-3">
          <div className="h-[3px] w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{
                width: `${progress}%`,
                transition: 'width 0.04s linear',
              }}
            />
          </div>
          <span
            className="text-white/50 text-[12px] text-center"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Memuat sistem...
          </span>
        </div>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-10">
        <span
          className="text-white/30 text-[11px]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Universitas Nusantara © 2024
        </span>
      </div>
    </div>
  );
}
