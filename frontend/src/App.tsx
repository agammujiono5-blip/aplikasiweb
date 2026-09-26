import { useEffect, useRef, useState } from 'react';
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

type Screen = 'loading' | 'login' | 'admin-login' | 'register' | 'forgot-password' | 'reset-password' | 'app';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [role, setRole] = useState<Role>('penyewa');
  const [activePage, setActivePage] = useState<ActivePage>('beranda');

  // Track async validation and loading screen state
  const authResolvedRef = useRef<{ screen: Screen; role: Role } | null>(null);
  const loadingScreenDoneRef = useRef(false);

  const navigateTo = (path: string, nextScreen: Screen) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setScreen(nextScreen);
  };

  const applyResolvedAuth = (targetScreen: Screen, targetRole: Role) => {
    authResolvedRef.current = { screen: targetScreen, role: targetRole };
    if (loadingScreenDoneRef.current) {
      setRole(targetRole);
      setScreen(targetScreen);
    }
  };

  // Route & Session validation on mount
  useEffect(() => {
    const validateSession = async () => {
      const initialPath = window.location.pathname;

      // Public routes
      if (initialPath === '/login' || initialPath === '/' || initialPath === '') {
        if (initialPath !== '/login') window.history.replaceState({}, '', '/login');
        applyResolvedAuth('login', 'penyewa');
        return;
      }

      if (initialPath === '/admin/login') {
        applyResolvedAuth('admin-login', 'admin');
        return;
      }

      if (initialPath === '/register') {
        applyResolvedAuth('register', 'penyewa');
        return;
      }

      if (initialPath === '/forgot-password') {
        applyResolvedAuth('forgot-password', 'penyewa');
        return;
      }

      if (initialPath === '/reset-password') {
        applyResolvedAuth('reset-password', 'penyewa');
        return;
      }

      // Dashboard routes — check token
      const isAdminRoute = initialPath.startsWith('/admin');

      const adminToken = localStorage.getItem('admin_auth_token') || (localStorage.getItem('user_role') === 'admin' ? localStorage.getItem('auth_token') : null);
      const userToken = localStorage.getItem('user_auth_token') || (localStorage.getItem('user_role') === 'penyewa' ? localStorage.getItem('auth_token') : null);

      if (isAdminRoute) {
        if (!adminToken) {
          window.history.replaceState({}, '', '/admin/login');
          applyResolvedAuth('admin-login', 'admin');
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
              localStorage.setItem('user_data', JSON.stringify(data.user));
            }
            applyResolvedAuth('app', 'admin');
            return;
          }
        } catch (err) {
          console.error('Admin session validation error:', err);
        }

        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_user_data');
        window.history.replaceState({}, '', '/admin/login');
        applyResolvedAuth('admin-login', 'admin');
        return;
      }

      // User / Penyewa route
      if (!userToken) {
        window.history.replaceState({}, '', '/login');
        applyResolvedAuth('login', 'penyewa');
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
          applyResolvedAuth('app', 'penyewa');
          return;
        }
      } catch (err) {
        console.error('User session validation error:', err);
      }

      localStorage.removeItem('user_auth_token');
      localStorage.removeItem('user_data');
      window.history.replaceState({}, '', '/login');
      applyResolvedAuth('login', 'penyewa');
    };

    validateSession();
  }, []);

  const handleLoadingComplete = () => {
    loadingScreenDoneRef.current = true;
    if (authResolvedRef.current) {
      setRole(authResolvedRef.current.role);
      setScreen(authResolvedRef.current.screen);
    }
  };

  // Browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;

      if (path === '/admin/login') setScreen('admin-login');
      else if (path === '/register') setScreen('register');
      else if (path === '/forgot-password') setScreen('forgot-password');
      else if (path === '/reset-password') setScreen('reset-password');
      else if (path === '/login' || path === '/') setScreen('login');
      else if (path.startsWith('/admin')) {
        const adminTok = localStorage.getItem('admin_auth_token') || localStorage.getItem('auth_token');
        if (adminTok) { setRole('admin'); setScreen('app'); }
        else setScreen('admin-login');
      } else if (path === '/dashboard') {
        const userTok = localStorage.getItem('user_auth_token') || localStorage.getItem('auth_token');
        if (userTok) { setRole('penyewa'); setScreen('app'); }
        else setScreen('login');
      } else {
        setScreen('login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (r: Role) => {
    setRole(r);
    setActivePage('beranda');
    navigateTo(r === 'admin' ? '/admin/dashboard' : '/dashboard', 'app');
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
    setActivePage(page as ActivePage);
  };

  if (screen === 'loading') return <LoadingScreen onComplete={handleLoadingComplete} />;
  if (screen === 'forgot-password') return <ForgotPasswordPage onNavigateLogin={() => navigateTo('/login', 'login')} />;
  if (screen === 'reset-password') return <ResetPasswordPage onNavigateLogin={() => navigateTo('/login', 'login')} />;
  if (screen === 'register') return <RegisterPage onNavigateLogin={() => navigateTo('/login', 'login')} onRegisterSuccess={handleLogin} />;
  if (screen === 'admin-login') return <AdminLoginPage onLogin={handleLogin} onNavigateLogin={() => navigateTo('/login', 'login')} />;
  if (screen === 'login') return (
    <LoginPage
      onLogin={handleLogin}
      onNavigateRegister={() => navigateTo('/register', 'register')}
      onNavigateForgotPassword={() => navigateTo('/forgot-password', 'forgot-password')}
      onNavigateAdmin={() => navigateTo('/admin/login', 'admin-login')}
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
      {renderPage()}
    </Layout>
  );
}
