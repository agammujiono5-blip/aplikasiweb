import { useState } from 'react';

export type Role = 'penyewa' | 'admin';
export type PenyewaPage = 'beranda' | 'ajukan' | 'riwayat' | 'jadwal' | 'profil';
export type AdminPage = 'beranda' | 'pengajuan' | 'ruangan' | 'jadwal' | 'pengguna';
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
  ];

  const navItems = role === 'penyewa' ? penyewaNav : adminNav;

  const userName = role === 'penyewa' ? 'Rizky Dharma' : 'Bpk. Hendra';
  const userSub = role === 'penyewa' ? '2021001234' : 'Petugas Sarpras';
  const userInitials = role === 'penyewa' ? 'RD' : 'BH';
  const badgeLabel = role === 'penyewa' ? 'Mahasiswa' : 'Admin';

  return (
    <div className="min-h-screen flex bg-[#f5f6fa]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static z-30 top-0 bottom-0 left-0 w-[240px] bg-white border-r border-[rgba(201,196,212,0.4)]
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[rgba(201,196,212,0.3)]">
          <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${role === 'admin' ? 'bg-[#342586]' : 'bg-[#4b3f9e]'}`}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
              <rect x="13" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.6"/>
              <rect x="2" y="13" width="7" height="7" rx="2" fill="white" fillOpacity="0.6"/>
              <rect x="13" y="13" width="7" height="7" rx="2" fill="white"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[#111c2d] text-[14px] font-bold leading-tight">SiPinjam</span>
            <span className="text-[#787583] text-[11px]">Kampus Nusantara</span>
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
        <div className="px-4 py-4 border-t border-[rgba(201,196,212,0.3)]">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0
              ${role === 'admin' ? 'bg-[#fff3cd] text-[#b45309]' : 'bg-[#ece9fe] text-[#4b3f9e]'}`}>
              {userInitials}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[#111c2d] text-[13px] font-semibold truncate">{userName}</span>
              <span className="text-[#787583] text-[11px] truncate">{userSub}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
              ${role === 'admin' ? 'bg-[#ffe4b5] text-[#b45309]' : 'bg-[#d1fae5] text-[#065f46]'}`}>
              {badgeLabel}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-[#787583] text-[13px] hover:text-[#ba1a1a] transition-colors py-2 rounded-[8px] hover:bg-[#fee2e2]/40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[rgba(201,196,212,0.3)] sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f5f6fa]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#474552" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="text-[#111c2d] text-[15px] font-bold">SiPinjam Kampus</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
