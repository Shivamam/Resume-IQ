import useAuthStore from '../store/authStore';

export default function Navbar({ title }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className='h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6'>
      <h1 className='text-lg font-semibold text-gray-900'>{title}</h1>

      <div className='flex items-center gap-3'>
        <div className='text-right'>
          <p className='text-sm font-medium text-gray-900'>{user?.name}</p>
          <p className='text-xs text-gray-500'>{user?.email}</p>
        </div>
        <div className='w-9 h-9 rounded-full bg-[#eef2ff] flex items-center justify-center text-[#4f46e5] font-semibold text-sm'>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
