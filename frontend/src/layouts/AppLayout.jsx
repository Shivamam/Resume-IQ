import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const pageTitles = {
  '/dashboard': 'Candidates',
  '/upload': 'Upload Resumes',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const location = useLocation();
  const title = location.pathname.startsWith('/candidates/')
    ? 'Candidate Detail'
    : pageTitles[location.pathname] || 'Resume IQ';

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
