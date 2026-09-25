import { useEffect, useRef, useState } from 'react';
import LoadingScreen from './pages/LoadingScreen';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import type { Role, ActivePage } from './components/Layout';

// Penyewa pages
import Beranda from './pages/penyewa/Beranda';
import AjukanPeminjaman from './pages/penyewa/AjukanPeminjaman';
import Dashboard from './pages/Dashboard';
import JadwalRuangan from './pages/penyewa/JadwalRuangan';
import ProfilSaya from './pages/penyewa/ProfilSaya';

// Admin pages
import AdminBeranda from './pages/admin/AdminBeranda';
import KelolaPengajuan from './pages/admin/KelolaPengajuan';
import KelolaRuangan from './pages/admin/KelolaRuangan';
import AdminJadwal from './pages/admin/AdminJadwal';
import DataPengguna from './pages/admin/DataPengguna';

type Screen = 'loading' | 'login' | 'admin-login' | 'register' | 'app';

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

      // 1. Explicit login or register routes always render their respective pages
      if (initialPath === '/login' || initialPath === '/' || initialPath === '') {
        if (initialPath !== '/login') {
          window.history.replaceState({}, '', '/login');
        }
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

      // 2. For dashboard routes (/dashboard, /admin/dashboard), check token
      const token = localStorage.getItem('auth_token');
      const storedRole = localStorage.getItem('user_role');

      if (!token) {
        window.history.replaceState({}, '', '/login');
        applyResolvedAuth('login', 'penyewa');
        return;
      }

      // If user claims to be admin, verify with GET /api/admin/me
      if (storedRole === 'admin') {
        try {
          const adminRes = await fetch('http://localhost:8000/api/admin/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (adminRes.ok) {
            const data = await adminRes.json();
            if (data.user) {
              localStorage.setItem('user_data', JSON.stringify(data.user));
            }
            applyResolvedAuth('app', 'admin');
            return;
          }

          // If /api/admin/me returns 403 for student token, maintain user as mahasiswa
          if (adminRes.status === 403) {
            const userRes = await fetch('http://localhost:8000/api/user/me', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
            });

            if (userRes.ok) {
              const data = await userRes.json();
              localStorage.setItem('user_role', 'penyewa');
              if (data.user) {
                localStorage.setItem('user_data', JSON.stringify(data.user));
              }
              window.history.replaceState({}, '', '/dashboard');
              applyResolvedAuth('app', 'penyewa');
              return;
            }
          }
        } catch (err) {
          console.error('Session validation error:', err);
        }

        // Invalid token: clear storage and redirect to admin login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_data');
        window.history.replaceState({}, '', '/admin/login');
        applyResolvedAuth('admin-login', 'admin');
        return;
      }

      // Default: verify with GET /api/user/me
      try {
        const userRes = await fetch('http://localhost:8000/api/user/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (userRes.ok) {
          const data = await userRes.json();
          if (data.user) {
            localStorage.setItem('user_data', JSON.stringify(data.user));
          }
          applyResolvedAuth('app', 'penyewa');
          return;
        }

        // Check if token actually belongs to admin
        if (userRes.status === 403) {
          const adminRes = await fetch('http://localhost:8000/api/admin/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (adminRes.ok) {
            const data = await adminRes.json();
            localStorage.setItem('user_role', 'admin');
            if (data.user) {
              localStorage.setItem('user_data', JSON.stringify(data.user));
            }
            window.history.replaceState({}, '', '/admin/dashboard');
            applyResolvedAuth('app', 'admin');
            return;
          }
        }
      } catch (err) {
        console.error('Session validation error:', err);
      }

      // Invalid token: clear storage and redirect to student login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
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

  // Browser back/forward (popstate) navigation handling
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const token = localStorage.getItem('auth_token');
      const storedRole = localStorage.getItem('user_role') as Role | null;

      if (path === '/admin/login') {
        setScreen('admin-login');
      } else if (path === '/register') {
        setScreen('register');
      } else if (path === '/login' || path === '/') {
        setScreen('login');
      } else if (path === '/dashboard' || path === '/admin/dashboard') {
        if (token && storedRole) {
          setRole(storedRole);
          setScreen('app');
        } else {
          setScreen('login');
        }
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
    const targetPath = r === 'admin' ? '/admin/dashboard' : '/dashboard';
    navigateTo(targetPath, 'app');
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token');
    const currentRole = role;

    if (token) {
      try {
        const endpoint = currentRole === 'admin'
          ? 'http://localhost:8000/api/admin/logout'
          : 'http://localhost:8000/api/user/logout';

        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
      } catch (err) {
        console.error('Logout request failed:', err);
      }
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_data');

    if (currentRole === 'admin') {
      navigateTo('/admin/login', 'admin-login');
    } else {
      navigateTo('/login', 'login');
    }
  };

  const handleNavigate = (page: string) => {
    setActivePage(page as ActivePage);
  };

  if (screen === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (screen === 'register') {
    return (
      <RegisterPage
        onNavigateLogin={() => navigateTo('/login', 'login')}
        onRegisterSuccess={handleLogin}
      />
    );
  }

  if (screen === 'admin-login') {
    return (
      <AdminLoginPage
        onLogin={handleLogin}
        onNavigateLogin={() => navigateTo('/login', 'login')}
      />
    );
  }

  if (screen === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onNavigateRegister={() => navigateTo('/register', 'register')}
      />
    );
  }

  const renderPage = () => {
    if (role === 'penyewa') {
      switch (activePage) {
        case 'beranda': return <Beranda onNavigate={handleNavigate} />;
        case 'ajukan': return <AjukanPeminjaman onNavigate={handleNavigate} />;
        case 'riwayat': return <Dashboard onLogout={handleLogout} />;
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
        default: return <AdminBeranda onNavigate={handleNavigate} />;
      }
    }
  };

  return (
    <Layout
      role={role}
      activePage={activePage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}
