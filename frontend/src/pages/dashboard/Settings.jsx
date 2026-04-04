import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

function Section({ title, description, children }) {
  return (
    <div className='card p-6'>
      <div className='mb-6 pb-4 border-b border-gray-100'>
        <h3 className='text-sm font-semibold text-gray-900'>{title}</h3>
        {description && (
          <p className='text-xs text-gray-500 mt-1'>{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`px-3 py-2 rounded-lg border text-sm ${styles[type]}`}>
      {message}
    </div>
  );
}

export default function Settings() {
  const { user, setUser, logout } = useAuthStore();

  // Profile form
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password form
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const handleProfileChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError(null);
    setProfileLoading(true);
    try {
      const res = await api.patch('/users/me', { name: profile.name });
      setUser(res.data);
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);

    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwords.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswordMsg('Password changed successfully');
      setPasswords({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setPasswordError(
        err.response?.data?.detail || 'Failed to change password',
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Profile info */}
      <Section title='Profile' description='Update your display name'>
        <form onSubmit={handleProfileSubmit} className='space-y-4'>
          <div className='flex items-center gap-4 mb-6'>
            <div className='w-16 h-16 rounded-full bg-[#eef2ff] flex items-center justify-center text-[#4f46e5] font-bold text-2xl'>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className='font-medium text-gray-900'>{user?.name}</p>
              <p className='text-sm text-gray-500'>{user?.email}</p>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Full name
            </label>
            <input
              className='input'
              type='text'
              name='name'
              value={profile.name}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email
            </label>
            <input
              className='input bg-gray-50 cursor-not-allowed'
              type='email'
              value={profile.email}
              disabled
            />
            <p className='text-xs text-gray-400 mt-1'>
              Email cannot be changed
            </p>
          </div>

          <Alert type='success' message={profileMsg} />
          <Alert type='error' message={profileError} />

          <button
            type='submit'
            className='btn-primary'
            disabled={profileLoading}
          >
            {profileLoading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </Section>

      {/* Change password */}
      <Section
        title='Change password'
        description='Must be at least 8 characters'
      >
        <form onSubmit={handlePasswordSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Current password
            </label>
            <input
              className='input'
              type='password'
              name='current_password'
              value={passwords.current_password}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              New password
            </label>
            <input
              className='input'
              type='password'
              name='new_password'
              value={passwords.new_password}
              onChange={handlePasswordChange}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Confirm new password
            </label>
            <input
              className='input'
              type='password'
              name='confirm_password'
              value={passwords.confirm_password}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <Alert type='success' message={passwordMsg} />
          <Alert type='error' message={passwordError} />

          <button
            type='submit'
            className='btn-primary'
            disabled={passwordLoading}
          >
            {passwordLoading ? 'Changing...' : 'Change password'}
          </button>
        </form>
      </Section>

      {/* Danger zone */}
      <Section title='Session' description='Manage your current session'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-900'>Sign out</p>
            <p className='text-xs text-gray-500 mt-0.5'>
              Sign out of your account on this device
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className='btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50'
          >
            Sign out
          </button>
        </div>
      </Section>
    </div>
  );
}
