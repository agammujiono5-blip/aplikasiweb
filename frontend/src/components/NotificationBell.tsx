import { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { api } from '../api/client';
import type { NotificationItem } from '../api/client';

// ─── Icon helpers ────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Type config ─────────────────────────────────────────────────────────────
const typeConfig: Record<string, { icon: React.ReactNode; accent: string; bg: string; label: string }> = {
  info:    { icon: <MessageSquare className="w-4 h-4 text-[#4b3f9e]" />, accent: '#4b3f9e', bg: '#f0effe', label: 'Info' },
  success: { icon: <CheckCircle2 className="w-4 h-4 text-[#059669]" />, accent: '#059669', bg: '#ecfdf5', label: 'Disetujui' },
  warning: { icon: <AlertTriangle className="w-4 h-4 text-[#d97706]" />, accent: '#d97706', bg: '#fffbeb', label: 'Perhatian' },
  error:   { icon: <XCircle className="w-4 h-4 text-[#dc2626]" />, accent: '#dc2626', bg: '#fff1f2', label: 'Ditolak' },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const [open, setOpen]         = useState(false);
  const [items, setItems]       = useState<NotificationItem[]>([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const [visible, setVisible]   = useState(false);   // animate in/out
  const dropdownRef = useRef<HTMLDivElement>(null);
  const openRef     = useRef(false);

  // ── Fetch unread count ────────────────────────────────────────────────────
  const fetchCount = async () => {
    try { setUnread(await api.notifications.getUnreadCount()); } catch { /* ignore */ }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await api.notifications.getAll();
      setItems(data);
      setUnread(data.filter(n => !n.is_read).length);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchCount();
    const iv = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchCount();
    }, 20_000);
    const handler = () => fetchCount();
    window.addEventListener('sipinjam:realtime-update', handler);
    return () => { clearInterval(iv); window.removeEventListener('sipinjam:realtime-update', handler); };
  }, []);

  const openDropdown = () => {
    openRef.current = true;
    setOpen(true);
    // slight delay so DOM mounts before animation class
    requestAnimationFrame(() => setVisible(true));
    fetchAll();
  };

  const closeDropdown = () => {
    setVisible(false);
    openRef.current = false;
    setTimeout(() => setOpen(false), 200);
  };

  // ── Outside click to close ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openRef.current && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Escape to close ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && openRef.current) closeDropdown(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const toggleDropdown = () => (openRef.current ? closeDropdown() : openDropdown());

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleMarkRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const unreadItems = items.filter(n => !n.is_read);
  const readItems   = items.filter(n => n.is_read);

  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── Bell Trigger ─────────────────────────────────────────────────── */}
      <button
        onClick={toggleDropdown}
        aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative w-8 h-8 flex items-center justify-center rounded-[9px] transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b3f9e] ${
          open
            ? 'bg-[#4b3f9e] shadow-[0_0_0_3px_rgba(75,63,158,0.18)]'
            : 'hover:bg-[#ece9fe]'
        }`}
        title="Notifikasi"
      >
        {/* Bell icon — white when open */}
        <svg
          width="16" height="16"
          viewBox="0 0 24 24"
          fill={open ? 'rgba(255,255,255,0.25)' : 'none'}
          stroke={open ? '#fff' : '#4b3f9e'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'all 0.2s' }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Badge */}
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-white"
            aria-hidden="true"
            style={{ animation: 'bellPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ───────────────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label="Panel Notifikasi"
          className="absolute bottom-full left-0 mb-2 w-[340px] rounded-[18px] overflow-hidden z-[99]"
          style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(201,196,212,0.55)',
            boxShadow: '0 -4px 32px rgba(30,20,80,0.14), 0 2px 8px rgba(30,20,80,0.06)',
            animation: visible
              ? 'panelIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both'
              : 'panelOut 0.18s ease-in both',
          }}
        >

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#111c2d] text-[13px] font-bold">Notifikasi</span>
              {unread > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#4b3f9e] text-white text-[9px] font-bold">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[#4b3f9e] text-[11px] font-semibold hover:bg-[#ece9fe] rounded-[6px] px-2 py-1 transition-colors cursor-pointer"
                  title="Tandai semua dibaca"
                >
                  <IconCheck />
                  Baca semua
                </button>
              )}
              <button
                onClick={closeDropdown}
                className="w-6 h-6 flex items-center justify-center rounded-[6px] text-[#787583] hover:bg-[#f5f6fa] hover:text-[#111c2d] transition-colors cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <IconClose />
              </button>
            </div>
          </div>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="max-h-[360px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c9c4d4 transparent' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#e0dcfa] border-t-[#4b3f9e] animate-spin" />
                <span className="text-[#787583] text-[12px]">Memuat notifikasi…</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 px-6">
                <div className="w-12 h-12 rounded-full bg-[#f0effe] flex items-center justify-center text-[#4b3f9e] mb-1">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-[#111c2d] text-[13px] font-semibold">Belum ada notifikasi</p>
                <p className="text-[#787583] text-[12px] text-center">Notifikasi pengajuan akan muncul di sini</p>
              </div>
            ) : (
              <>
                {/* Unread section */}
                {unreadItems.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5">
                      <span className="text-[10px] font-bold text-[#787583] uppercase tracking-wider">Belum Dibaca</span>
                    </div>
                    {unreadItems.map(n => <NotifItem key={n.id} n={n} onRead={handleMarkRead} />)}
                  </div>
                )}

                {/* Read section */}
                {readItems.length > 0 && (
                  <div className={unreadItems.length > 0 ? 'mt-1' : ''}>
                    {unreadItems.length > 0 && (
                      <div className="px-4 py-1.5 mt-1">
                        <span className="text-[10px] font-bold text-[#787583] uppercase tracking-wider">Sudah Dibaca</span>
                      </div>
                    )}
                    {readItems.map(n => <NotifItem key={n.id} n={n} onRead={handleMarkRead} />)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          {items.length > 0 && (
            <div className="border-t border-[rgba(201,196,212,0.3)] px-4 py-3 flex items-center justify-center">
              <span className="text-[#787583] text-[11px]">
                {items.length} notifikasi · {unread === 0 ? 'Semua sudah dibaca' : `${unread} belum dibaca`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Keyframes ────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes bellPop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.25); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes panelIn {
          0%   { opacity: 0; transform: translateY(8px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes panelOut {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(6px) scale(0.97); }
        }
        @keyframes itemIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Single notification item ─────────────────────────────────────────────────
function NotifItem({ n, onRead }: { n: NotificationItem; onRead: (id: number) => void }) {
  const cfg = typeConfig[n.type] || typeConfig.info;

  return (
    <div
      onClick={() => !n.is_read && onRead(n.id)}
      role="article"
      aria-label={n.title}
      className="group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150"
      style={{
        backgroundColor: !n.is_read ? cfg.bg : 'transparent',
        animation: 'itemIn 0.18s ease both',
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = !n.is_read ? cfg.bg : '#f8f9fc')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = !n.is_read ? cfg.bg : 'transparent')}
    >
      {/* Icon circle */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[15px] mt-0.5"
        style={{ backgroundColor: !n.is_read ? cfg.accent + '1a' : '#f0f1f5' }}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <span
            className="text-[12px] leading-snug"
            style={{ color: '#111c2d', fontWeight: !n.is_read ? 600 : 500 }}
          >
            {n.title}
          </span>
          {!n.is_read && (
            <span
              className="w-2 h-2 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: cfg.accent }}
            />
          )}
        </div>
        <p className="text-[#474552] text-[11px] mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[4px]"
            style={{ backgroundColor: cfg.accent + '18', color: cfg.accent }}
          >
            {cfg.label}
          </span>
          <span className="text-[#b0a8c0] text-[10px]">·</span>
          <span className="text-[#b0a8c0] text-[10px]">{timeAgo(n.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
