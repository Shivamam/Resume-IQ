import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, verifyOtp, getMe } from '../../api/auth';
import useAuthStore from '../../store/authStore';
import OtpInput from '../../components/OtpInput';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens, setUser } = useAuthStore();

  const [step, setStep] = useState(1); // 1 = password, 2 = otp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      setStep(2);
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.replace(/\s/g, '').length < 6) {
      setError('Please enter the full 6-digit OTP');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtp({ email, otp: otp.trim() });
      setTokens(res.data.access_token, res.data.refresh_token);
      const me = await getMe();
      setUser(me.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(null);
    try {
      await login({ email, password });
      startResendTimer();
    } catch (err) {
      setError('Failed to resend OTP', err);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='card w-full max-w-md p-8'>
        <div className='flex items-center justify-center gap-2 mb-8'>
          <div
            className={`w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-[#4f46e5]' : 'bg-gray-300'}`}
          />
          <div
            className={`w-2.5 h-2.5 rounded-full ${step === 2 ? 'bg-[#4f46e5]' : 'bg-gray-300'}`}
          />
        </div>

        {step === 1 && (
          <>
            <div className='mb-8 text-center'>
              <h1 className='text-2xl font-bold text-gray-900'>Welcome back</h1>
              <p className='text-gray-500 text-sm mt-1'>Sign in to Resume IQ</p>
            </div>

            {location.state?.registered && (
              <div className='mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm'>
                Account created! Please sign in.
              </div>
            )}

            {error && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email
                </label>
                <input
                  className='input'
                  type='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder='Your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type='submit'
                className='btn-primary w-full mt-2'
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>

            <p className='text-center text-sm text-gray-500 mt-6'>
              Don't have an account?{' '}
              <Link
                to='/register'
                className='text-[#4f46e5] font-medium hover:underline'
              >
                Sign up
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className='mb-8 text-center'>
              <h1 className='text-2xl font-bold text-gray-900'>
                Check your email
              </h1>
              <p className='text-gray-500 text-sm mt-2'>
                We sent a 6-digit code to
                <br />
                <span className='font-medium text-gray-700'>{email}</span>
              </p>
            </div>

            {error && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center'>
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className='space-y-6'>
              <OtpInput value={otp} onChange={setOtp} />

              <button
                type='submit'
                className='btn-primary w-full'
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <div className='text-center mt-4'>
              <button
                onClick={handleResend}
                disabled={resendTimer > 0}
                className='text-sm text-gray-500 hover:text-[#4f46e5] disabled:cursor-not-allowed disabled:text-gray-400'
              >
                {resendTimer > 0
                  ? `Resend OTP in ${resendTimer}s`
                  : 'Resend OTP'}
              </button>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setOtp('');
                setError(null);
              }}
              className='w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3'
            >
              ← Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
