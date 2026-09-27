import { useEffect, useRef, useState, useCallback } from 'react';
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

type Screen = 'loading' | 'login' | 'admin-login' | 'register' | 'forgot-password' | 'reset-password' | 'app';

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
          const adminRes = await fetch('http://localhost:8000/api/admin/me', {
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
        const userRes = await fetch('http://localhost:8000/api/user/me', {
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
    setRole(r);
    setActivePage('beranda');
    const path = r === 'admin' ? '/admin/dashboard' : '/dashboard';
    navigateTo(path, 'app');
  };

  const handleLogout = async () => {
    const currentRole = role;
    const token = currentRole === 'admin'
      ? (localStorage.getItem('admin_auth_token') || localStorage.getItem('auth_token'))
      : (localStorage.getItem('user_auth_token') || localStorage.getItem('auth_token'));

    if (token) {
      try {
        const endpoint = currentRole === 'admin'
          ? 'http://localhost:8000/api/admin/logout'
          : 'http://localhost:8000/api/user/logout';
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
      navigateTo('/admin/login', 'admin-login');
    } else {
      localStorage.removeItem('user_auth_token');
      if (localStorage.getItem('user_role') === 'penyewa') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_data');
      }
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
        case 'riwayat': return <RiwayatPage />;
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
      <ErrorBoundary key={`${role}-${activePage}`}>
        {renderPage()}
      </ErrorBoundary>
    </Layout>
  );
}
