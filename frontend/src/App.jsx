import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Upload from './pages/dashboard/Upload';
import CandidateDetail from './pages/dashboard/CandidateDetail';
import useAuthStore from './store/authStore';
import Settings from './pages/dashboard/Settings';

function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? children : <Navigate to='/login' replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/upload' element={<Upload />} />
        <Route path='/candidates/:id' element={<CandidateDetail />} />
        <Route path='/settings' element={<Settings />} />
      </Route>
      <Route path='*' element={<Navigate to='/login' replace />} />
    </Routes>
  );
}
