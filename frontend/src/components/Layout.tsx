import { useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import ToastContainer from './Toast';

export type Role = 'penyewa' | 'admin';
export type PenyewaPage = 'beranda' | 'ajukan' | 'riwayat' | 'jadwal' | 'profil';
export type AdminPage = 'beranda' | 'pengajuan' | 'ruangan' | 'jadwal' | 'pengguna' | 'log-aktivitas';
export type ActivePage = PenyewaPage | AdminPage;

interface NavItem {
  key: ActivePage;
  label: string;
  icon: React.ReactNode;
}

interface LayoutProps {
  role: Role;
  activePage: ActivePage;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const IconList = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="19" rx="2"/><path d="M8 21V3m8 18V3M2 12h20M2 7h6M2 17h6M16 7h6M16 17h6"/>
  </svg>
);
const IconClipboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

export default function Layout({ role, activePage, onNavigate, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const penyewaNav: NavItem[] = [
    { key: 'beranda', label: 'Beranda', icon: <IconHome /> },
    { key: 'ajukan', label: 'Ajukan Peminjaman', icon: <IconPlus /> },
    { key: 'riwayat', label: 'Riwayat & Status', icon: <IconList /> },
    { key: 'jadwal', label: 'Jadwal Ruangan', icon: <IconCalendar /> },
    { key: 'profil', label: 'Profil Saya', icon: <IconUser /> },
  ];

  const adminNav: NavItem[] = [
    { key: 'beranda', label: 'Dashboard', icon: <IconHome /> },
    { key: 'pengajuan', label: 'Kelola Pengajuan', icon: <IconClipboard /> },
    { key: 'ruangan', label: 'Kelola Ruangan', icon: <IconBuilding /> },
    { key: 'jadwal', label: 'Jadwal Ruangan', icon: <IconCalendar /> },
    { key: 'pengguna', label: 'Data Pengguna', icon: <IconUsers /> },
    { key: 'log-aktivitas', label: 'Log Aktivitas', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ) },
  ];

  const navItems = role === 'penyewa' ? penyewaNav : adminNav;

  const [currentUser, setCurrentUser] = useState<{
    name?: string;
    nama?: string;
    nim?: string;
    email?: string;
    petugas_id?: string;
    jabatan?: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('user_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem('user_data');
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    };

    window.addEventListener('sipinjam:realtime-update', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('sipinjam:realtime-update', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  const rawName = currentUser?.name || currentUser?.nama;
  const userName = rawName || (role === 'penyewa' ? 'Mahasiswa' : 'Admin Sarpras');
  const userSub = role === 'penyewa'
    ? (currentUser?.nim ? `NIM: ${currentUser.nim}` : (currentUser?.email || 'Mahasiswa'))
    : (currentUser?.petugas_id ? `ID: ${currentUser.petugas_id}` : (currentUser?.jabatan || 'Petugas Sarpras'));
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || (role === 'penyewa' ? 'M' : 'A');
  const badgeLabel = role === 'penyewa' ? 'Mahasiswa' : 'Admin';

  return (
    <div className="min-h-screen flex bg-[#f5f6fa]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static z-30 top-0 bottom-0 left-0 w-[280px] bg-white border-r border-[rgba(201,196,212,0.4)]
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo - UNY Branding (matches login page) */}
        <div className="flex flex-col items-center px-4 py-5 border-b border-[rgba(201,196,212,0.3)]">
          <div className="flex items-center gap-2.5 w-full">
            {/* Official UNY Logo */}
            <img
              src="/uny-logo.png"
              alt="Logo UNY"
              className="w-11 h-11 object-contain shrink-0"
            />
            {/* Vertical Divider */}
            <div className="h-10 w-[1.5px] bg-[#c9c4d4]/50 shrink-0" />
            {/* University Title */}
            <div className="flex flex-col justify-center min-w-0">
              <span
                className="text-[#111c2d] text-[13px] font-bold tracking-tight leading-tight"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                UNIVERSITAS
              </span>
              <span
                className="text-[#111c2d] text-[11px] font-bold tracking-tight leading-tight"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                NEGERI YOGYAKARTA
              </span>
              <div className="w-full h-[1px] bg-[#c9c4d4]/40 my-0.5" />
              <span
                className="text-[#787583] text-[8px] font-semibold italic tracking-tight leading-none"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                Unggul, Kreatif, dan Inovatif Berkelanjutan
              </span>
            </div>
          </div>
          {/* SiPinjam subtitle */}
          <div className="w-full border-t border-[#c9c4d4]/25 mt-3 pt-2 text-center">
            <p className="text-[10px] font-semibold text-[#4b3f9e] tracking-[0.12em] uppercase">
              SiPinjam · Kampus Nusantara
            </p>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 border-b border-[rgba(201,196,212,0.2)]">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              role === 'admin'
                ? 'bg-[#ffe4b5] text-[#b45309]'
                : 'bg-[#ece9fe] text-[#4b3f9e]'
            }`}
          >
            {role === 'admin' ? '⚙️ Panel Admin' : '🎓 Portal Mahasiswa'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.key === activePage;
            return (
              <button
                key={item.key}
                onClick={() => { onNavigate(item.key); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-left transition-colors w-full
                  ${isActive
                    ? role === 'admin'
                      ? 'bg-[#fff3cd] text-[#b45309]'
                      : 'bg-[#ece9fe] text-[#4b3f9e]'
                    : 'text-[#474552] hover:bg-[#f5f6fa]'
                  }`}
              >
                <span className={isActive ? (role === 'admin' ? 'text-[#b45309]' : 'text-[#4b3f9e]') : 'text-[#787583]'}>
                  {item.icon}
                </span>
                <span className={`text-[13px] ${isActive ? 'font-semibold' : 'font-normal'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-5 py-4 border-t border-[rgba(201,196,212,0.3)] bg-[#fafafc]">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0
              ${role === 'admin' ? 'bg-[#fff3cd] text-[#b45309]' : 'bg-[#ece9fe] text-[#4b3f9e]'}`}>
              {userInitials}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[#111c2d] text-[14px] font-bold truncate leading-tight" title={userName}>{userName}</span>
              <span className="text-[#787583] text-[12px] truncate mt-0.5" title={userSub}>{userSub}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between w-full mb-4">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
              ${role === 'admin' ? 'bg-[#ffe4b5] text-[#b45309]' : 'bg-[#d1fae5] text-[#065f46]'}`}>
              {badgeLabel}
            </span>
            {role === 'penyewa' && <NotificationBell />}
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 text-[#787583] text-[13px] font-semibold hover:text-[#ba1a1a] transition-colors py-2 rounded-[8px] hover:bg-[#fee2e2]/50 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Keluar Sesi
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col w-full bg-[#f8f9fa]">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-[rgba(201,196,212,0.3)] sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f5f6fa]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <img src="/uny-logo.png" alt="Logo UNY" className="w-7 h-7 object-contain" />
          <span className="text-[#111c2d] text-[15px] font-bold">SiPinjam Kampus</span>
        </div>

        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => setShowLogoutModal(false)}
        >
          {/* Modal content unchanged */}
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-[20px] w-full max-w-[380px] p-6 shadow-2xl flex flex-col items-center text-center border border-[rgba(255,255,255,0.4)]"
            style={{ animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-[#fee2e2] flex items-center justify-center text-[#ba1a1a] mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            
            <h3 className="text-[#111c2d] text-[18px] font-bold mb-2">Keluar dari SiPinjam?</h3>
            <p className="text-[#787583] text-[13px] leading-relaxed mb-6">
              Sesi Anda saat ini akan diakhiri. Pastikan semua pekerjaan atau pengajuan Anda telah tersimpan.
            </p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 h-[44px] rounded-[10px] border border-[rgba(201,196,212,0.6)] text-[#474552] text-[14px] font-semibold hover:bg-[#f5f6fa] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#4b3f9e]/30"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="flex-1 h-[44px] rounded-[10px] bg-[#ba1a1a] text-white text-[14px] font-semibold hover:bg-[#991b1b] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#ba1a1a]/40"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <ToastContainer />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
