import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, type SyntheticEvent } from 'react';
import {
  FaTriangleExclamation,
  FaEye,
  FaEyeSlash,
  FaShieldHalved,
  FaCalendarCheck,
  FaCircleCheck,
  FaArrowRight,
} from 'react-icons/fa6';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { ApiException } from '../services/api';

const HIGHLIGHTS = [
  {
    icon: FaCalendarCheck,
    title: 'Instant booking workflow',
    body:  'Lock crew and vendors in minutes — no more WhatsApp chaos.',
  },
  {
    icon: FaShieldHalved,
    title: 'Verified professionals',
    body:  'Every profile is GST-verified and background-checked.',
  },
  {
    icon: FaCircleCheck,
    title: 'One source of truth',
    body:  'Projects, bookings, schedules and invoices in one place.',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, clearError, user } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect away from login page
  useEffect(() => {
    if (isAuthenticated && user) {
      const stateFrom = (location.state as { from?: Location })?.from?.pathname;
      const defaultPath = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(stateFrom ?? defaultPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  useEffect(() => {
    document.title = 'Welcome Back – Claapo Login';
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmed, password);
      // Navigation is handled by the isAuthenticated effect above
    } catch (err) {
      const msg =
        err instanceof ApiException
          ? err.payload.message
          : 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Claapo account to continue."
      backTo="/"
      backLabel="Back to home"
      brand={{
        eyebrow: 'Built for modern productions',
        headline: 'Run film productions without the chaos.',
        description:
          'Sign in to manage your projects, crew, equipment and invoices — all from one professional dashboard.',
        highlights: HIGHLIGHTS,
        bottomText: 'Trusted by 2,000+ professionals across India',
      }}
      footer={
        <>
          By signing in, you agree to our{' '}
          <Link to="/terms" className="hover:text-neutral-600 underline-offset-2 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="hover:text-neutral-600 underline-offset-2 hover:underline">Privacy Policy</Link>.
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-[13px] text-neutral-700 mb-1.5 font-semibold">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={loading}
            className="w-full rounded-xl px-4 py-3 border border-neutral-300 bg-white text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-all disabled:opacity-50"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-[13px] text-neutral-700 font-semibold">
              Password
            </label>
            <Link to="/forgot-password" className="text-[12px] text-[#3678F1] font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 pr-12 border border-neutral-300 bg-white text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 text-[13px] text-neutral-600 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-[#3678F1] focus:ring-[#3678F1]/30"
          />
          Keep me signed in on this device
        </label>

        {/* Inline error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 px-3.5 py-3">
            <FaTriangleExclamation className="text-[#991B1B] text-sm shrink-0 mt-0.5" aria-hidden />
            <p className="text-[13px] text-[#991B1B] leading-snug">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-[15px] font-semibold hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors shadow-brand disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-6 h-6 border-[2.5px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign In
              <FaArrowRight className="w-3.5 h-3.5" aria-hidden />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-[11px] uppercase tracking-[0.14em] text-neutral-400 font-semibold">or</span>
        </div>
      </div>

      <p className="text-center text-[14px] text-neutral-600">
        New to Claapo?{' '}
        <Link to="/register" className="text-[#3678F1] font-semibold hover:underline">
          Create a free account
        </Link>
      </p>
    </AuthLayout>
  );
}
