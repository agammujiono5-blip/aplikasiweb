import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE } from './api/base-url';
import { clearClientCache } from './api/client';
import LoadingScreen from './pages/LoadingScreen';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Layout from './components/Layout';
import type { Role, ActivePage } from './components/Layout';

// Penyewa pages
import Beranda from './pages/penyewa/Beranda';
import AjukanPeminjaman from './pages/penyewa/AjukanPeminjaman';
import RiwayatPage from './pages/penyewa/RiwayatPage';
import JadwalRuangan from './pages/penyewa/JadwalRuangan';
import ProfilSaya from './pages/penyewa/ProfilSaya';

// Admin pages
import AdminBeranda from './pages/admin/AdminBeranda';
import KelolaPengajuan from './pages/admin/KelolaPengajuan';
import KelolaRuangan from './pages/admin/KelolaRuangan';
import AdminJadwal from './pages/admin/AdminJadwal';
import DataPengguna from './pages/admin/DataPengguna';
import LogAktivitas from './pages/admin/LogAktivitas';
import { ErrorBoundary } from './components/ErrorBoundary';
import { openBackendErrorPage } from './utils/error-page';
import {
  SESSION_TIMEOUT_SECONDS,
  SESSION_TICK_MS,
  getLastActivity,
  markActivity,
  clearActivity,
  installActivityListeners,
} from './utils/session';

type Screen = 'loading' | 'login' | 'admin-login' | 'register' | 'forgot-password' | 'reset-password' | 'app';

const KNOWN_APP_ROUTES = new Set([
  '/dashboard', '/ajukan', '/riwayat', '/jadwal', '/profil',
  '/admin/dashboard', '/admin/pengajuan', '/admin/ruangan', '/admin/jadwal', '/admin/pengguna', '/admin/log-aktivitas',
]);

function getRouteInfo(path: string): { screen: Screen; role: Role; page: ActivePage } {
  if (path === '/login' || path === '/' || path === '') {
    return { screen: 'login', role: 'penyewa', page: 'beranda' };
  }
  if (path === '/admin/login') {
    return { screen: 'admin-login', role: 'admin', page: 'beranda' };
  }
  if (path === '/register') {
    return { screen: 'register', role: 'penyewa', page: 'beranda' };
  }
  if (path === '/forgot-password') {
    return { screen: 'forgot-password', role: 'penyewa', page: 'beranda' };
  }
  if (path === '/reset-password') {
    return { screen: 'reset-password', role: 'penyewa', page: 'beranda' };
  }
  if (!KNOWN_APP_ROUTES.has(path)) {
    // Halaman error ditangani Laravel (resources/views/errors).
    openBackendErrorPage(404);
    return { screen: 'loading', role: 'penyewa', page: 'beranda' };
  }
  if (path.startsWith('/admin')) {
    let page: ActivePage = 'beranda';
    if (path.includes('/pengajuan')) page = 'pengajuan';
    else if (path.includes('/ruangan')) page = 'ruangan';
    else if (path.includes('/jadwal')) page = 'jadwal';
    else if (path.includes('/pengguna')) page = 'pengguna';
    else if (path.includes('/log-aktivitas')) page = 'log-aktivitas';
    return { screen: 'app', role: 'admin', page };
  }
  let page: ActivePage = 'beranda';
  if (path.includes('/ajukan')) page = 'ajukan';
  else if (path.includes('/riwayat')) page = 'riwayat';
  else if (path.includes('/jadwal')) page = 'jadwal';
  else if (path.includes('/profil')) page = 'profil';
  return { screen: 'app', role: 'penyewa', page };
}

/**
 * Akhiri sesi klien: (opsional) cabut token di backend, lalu bersihkan
 * localStorage & cache query milik role terkait.
 */
async function endSession(currentRole: Role, opts: { notifyBackend: boolean }): Promise<void> {
  const token = currentRole === 'admin'
    ? (localStorage.getItem('admin_auth_token') || localStorage.getItem('auth_token'))
    : (localStorage.getItem('user_auth_token') || localStorage.getItem('auth_token'));

  if (opts.notifyBackend && token) {
    try {
      const endpoint = currentRole === 'admin'
        ? `${API_BASE}/admin/logout`
        : `${API_BASE}/user/logout`;
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
  }

  if (currentRole === 'admin') {
    localStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_user_data');
    if (localStorage.getItem('user_role') === 'admin') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_data');
    }
  } else {
    localStorage.removeItem('user_auth_token');
    if (localStorage.getItem('user_role') === 'penyewa') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_data');
    }
  }

  clearActivity();
  clearClientCache();
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [role, setRole] = useState<Role>('penyewa');
  const [activePage, setActivePage] = useState<ActivePage>('beranda');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const targetRouteRef = useRef<{ screen: Screen; role: Role; page: ActivePage } | null>(null);

  const navigateTo = (path: string, nextScreen: Screen) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setScreen(nextScreen);
  };

  // Route & Session validation on mount
  useEffect(() => {
    const validateSession = async () => {
      const initialPath = window.location.pathname;
      const routeInfo = getRouteInfo(initialPath);
      targetRouteRef.current = routeInfo;

      // Public routes: no backend auth needed to resolve
      if (routeInfo.screen !== 'app') {
        if (initialPath === '/' || initialPath === '') {
          window.history.replaceState({}, '', '/login');
        }
        setIsAuthReady(true);
        return;
      }

      // Admin route authentication
      if (routeInfo.role === 'admin') {
        const adminToken = localStorage.getItem('admin_auth_token') || (localStorage.getItem('user_role') === 'admin' ? localStorage.getItem('auth_token') : null);
        if (!adminToken) {
          window.history.replaceState({}, '', '/admin/login');
          targetRouteRef.current = { screen: 'admin-login', role: 'admin', page: 'beranda' };
          setIsAuthReady(true);
          return;
        }

        try {
          const adminRes = await fetch(`${API_BASE}/admin/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}`, 'Accept': 'application/json' },
          });

          if (adminRes.ok) {
            const data = await adminRes.json();
            if (data.user) {
              localStorage.setItem('admin_user_data', JSON.stringify(data.user));
            }
            targetRouteRef.current = { screen: 'app', role: 'admin', page: routeInfo.page };
            setIsAuthReady(true);
            return;
          }
        } catch (err) {
          console.error('Admin session validation error:', err);
        }

        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_user_data');
        window.history.replaceState({}, '', '/admin/login');
        targetRouteRef.current = { screen: 'admin-login', role: 'admin', page: 'beranda' };
        setIsAuthReady(true);
        return;
      }

      // User / Penyewa route authentication
      const userToken = localStorage.getItem('user_auth_token') || (localStorage.getItem('user_role') === 'penyewa' ? localStorage.getItem('auth_token') : null);
      if (!userToken) {
        window.history.replaceState({}, '', '/login');
        targetRouteRef.current = { screen: 'login', role: 'penyewa', page: 'beranda' };
        setIsAuthReady(true);
        return;
      }

      try {
        const userRes = await fetch(`${API_BASE}/user/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${userToken}`, 'Accept': 'application/json' },
        });

        if (userRes.ok) {
          const data = await userRes.json();
          if (data.user) {
            localStorage.setItem('user_data', JSON.stringify(data.user));
          }
          targetRouteRef.current = { screen: 'app', role: 'penyewa', page: routeInfo.page };
          setIsAuthReady(true);
          return;
        }
      } catch (err) {
        console.error('User session validation error:', err);
      }

      localStorage.removeItem('user_auth_token');
      localStorage.removeItem('user_data');
      window.history.replaceState({}, '', '/login');
      targetRouteRef.current = { screen: 'login', role: 'penyewa', page: 'beranda' };
      setIsAuthReady(true);
    };

    validateSession();
  }, []);

  const handleLoadingComplete = useCallback(() => {
    if (targetRouteRef.current) {
      setRole(targetRouteRef.current.role);
      setActivePage(targetRouteRef.current.page);
      setScreen(targetRouteRef.current.screen);
    } else {
      setScreen('login');
    }
  }, []);

  /**
   * Watchdog sesi: setiap 0,5 detik cek apakah pengguna sudah diam lebih dari
   * 10 menit. Jika ya, akhiri sesi dan arahkan ke halaman login agar pengguna
   * login ulang untuk mendapatkan token/sesi baru.
   */
  useEffect(() => {
    if (screen !== 'app') return;

    // Jangan reset ke "baru aktif" bila sesudah refresh sudah melewati batas;
    // watchdog di bawah langsung mengakhiri sesi pada tick pertama.
    if (!sessionStorage.getItem('session_watchdog_init')) {
      sessionStorage.setItem('session_watchdog_init', '1');
      markActivity(true);
    }
    const uninstall = installActivityListeners(() => markActivity());

    const timer = window.setInterval(() => {
      const idleSeconds = (Date.now() - getLastActivity()) / 1000;
      if (idleSeconds < SESSION_TIMEOUT_SECONDS) return;

      window.clearInterval(timer);
      const expiredRole = role;
      endSession(expiredRole, { notifyBackend: false }).finally(() => {
        navigateTo(expiredRole === 'admin' ? '/admin/login' : '/login', expiredRole === 'admin' ? 'admin-login' : 'login');
      });
    }, SESSION_TICK_MS);

    return () => {
      window.clearInterval(timer);
      uninstall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, role]);

  // Browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const routeInfo = getRouteInfo(path);
      if (routeInfo.screen !== 'app') {
        setScreen(routeInfo.screen);
        setRole(routeInfo.role);
        return;
      }

      if (routeInfo.role === 'admin') {
        const adminTok = localStorage.getItem('admin_auth_token') || localStorage.getItem('auth_token');
        if (adminTok) {
          setRole('admin');
          setActivePage(routeInfo.page);
          setScreen('app');
        } else {
          setScreen('admin-login');
        }
      } else {
        const userTok = localStorage.getItem('user_auth_token') || localStorage.getItem('auth_token');
        if (userTok) {
          setRole('penyewa');
          setActivePage(routeInfo.page);
          setScreen('app');
        } else {
          setScreen('login');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (r: Role) => {
    // Sesi baru: mulai hitungan 10 menit aktivitas dari sekarang.
    markActivity(true);
    setRole(r);
    setActivePage('beranda');
    const path = r === 'admin' ? '/admin/dashboard' : '/dashboard';
    navigateTo(path, 'app');
  };

  const handleLogout = async () => {
    const currentRole = role;
    await endSession(currentRole, { notifyBackend: true });

    if (currentRole === 'admin') {
      navigateTo('/admin/login', 'admin-login');
    } else {
      navigateTo('/login', 'login');
    }
  };

  const handleNavigate = (page: string) => {
    const p = page as ActivePage;
    setActivePage(p);
    const newPath = role === 'admin'
      ? (p === 'beranda' ? '/admin/dashboard' : `/admin/${p}`)
      : (p === 'beranda' ? '/dashboard' : `/${p}`);
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  if (screen === 'loading') return <LoadingScreen onComplete={handleLoadingComplete} isReady={isAuthReady} />;
  if (screen === 'forgot-password') return <ForgotPasswordPage onNavigateLogin={() => navigateTo('/login', 'login')} />;
  if (screen === 'reset-password') return <ResetPasswordPage onNavigateLogin={() => navigateTo('/login', 'login')} />;
  if (screen === 'register') return <RegisterPage onNavigateLogin={() => navigateTo('/login', 'login')} onRegisterSuccess={handleLogin} />;
  if (screen === 'admin-login') return <AdminLoginPage onLogin={handleLogin} onNavigateLogin={() => navigateTo('/login', 'login')} />;
  if (screen === 'login') return (
    <LoginPage
      onLogin={handleLogin}
      onNavigateRegister={() => navigateTo('/register', 'register')}
      onNavigateForgotPassword={() => navigateTo('/forgot-password', 'forgot-password')}
    />
  );

  const renderPage = () => {
    if (role === 'penyewa') {
      switch (activePage) {
        case 'beranda': return <Beranda onNavigate={handleNavigate} />;
        case 'ajukan': return <AjukanPeminjaman onNavigate={handleNavigate} />;
        case 'riwayat': return <RiwayatPage onNavigate={handleNavigate} />;
        case 'jadwal': return <JadwalRuangan onNavigate={handleNavigate} />;
        case 'profil': return <ProfilSaya onLogout={handleLogout} />;
        default: return <Beranda onNavigate={handleNavigate} />;
      }
    } else {
      switch (activePage) {
        case 'beranda': return <AdminBeranda onNavigate={handleNavigate} />;
        case 'pengajuan': return <KelolaPengajuan />;
        case 'ruangan': return <KelolaRuangan />;
        case 'jadwal': return <AdminJadwal />;
        case 'pengguna': return <DataPengguna />;
        case 'log-aktivitas': return <LogAktivitas />;
        default: return <AdminBeranda onNavigate={handleNavigate} />;
      }
    }
  };

  return (
    <Layout role={role} activePage={activePage} onNavigate={handleNavigate} onLogout={handleLogout}>
      <ErrorBoundary key={`${role}-${activePage}`} fullPage>
        {renderPage()}
      </ErrorBoundary>
    </Layout>
  );
}
