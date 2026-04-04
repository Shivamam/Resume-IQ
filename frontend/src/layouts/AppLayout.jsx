import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import useAuthStore from '../store/authStore';
import axios from 'axios';

const pageTitles = {
  '/dashboard': 'Candidates',
  '/upload': 'Upload Resumes',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isTokenExpired, refreshToken, setTokens, logout } = useAuthStore();

  const title = location.pathname.startsWith('/candidates/')
    ? 'Candidate Detail'
    : pageTitles[location.pathname] || 'Resume IQ';

  useEffect(() => {
    const checkAndRefresh = async () => {
      if (!isTokenExpired()) return;

      if (!refreshToken) {
        logout();
        navigate('/login');
        return;
      }

      try {
        const res = await axios.post('/api/auth/refresh', {
          refresh_token: refreshToken,
        });
        setTokens(res.data.access_token, refreshToken);
      } catch {
        logout();
        navigate('/login');
      }
    };

    checkAndRefresh();
  }, [location.pathname]);

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar />
      <div className='flex-1 flex flex-col min-h-screen overflow-hidden min-w-0'>
        <Navbar title={title} />
        <main className='flex-1 overflow-y-auto p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
