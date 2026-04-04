import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../api/auth';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='card w-full max-w-md p-8'>
        <div className='mb-8 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Create account</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Get started with Resume IQ
          </p>
        </div>

        {error && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Full name
            </label>
            <input
              className='input'
              type='text'
              name='name'
              placeholder='John Doe'
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email
            </label>
            <input
              className='input'
              type='email'
              name='email'
              placeholder='you@example.com'
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Password
            </label>
            <input
              className='input'
              type='password'
              name='password'
              placeholder='Min 8 characters'
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>
          <button
            type='submit'
            className='btn-primary w-full mt-2'
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className='text-center text-sm text-gray-500 mt-6'>
          Already have an account?{' '}
          <Link
            to='/login'
            className='text-[#4f46e5] font-medium hover:underline'
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
