import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaVideo, FaTriangleExclamation, FaEye, FaEyeSlash } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { ApiException } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, clearError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect away from login page
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  useEffect(() => {
    document.title = 'Welcome Back – Claapo Login';
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
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
    <AppLayout headerVariant="back" backTo="/" backLabel="Back to Home">
      <div className="flex-1 flex items-center justify-center px-4 py-10 min-h-[calc(100vh-128px)]">
        <div className="w-full max-w-[420px]">
          {/* Brand mark */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#3678F1] flex items-center justify-center mb-4 shadow-lg shadow-[#3678F1]/25">
              <FaVideo className="text-white text-lg" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
            <p className="text-sm text-neutral-500 mt-1">Sign in to your Claapo account</p>
          </div>

          <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm shadow-neutral-100">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-neutral-700 text-sm mb-1.5 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="rounded-xl w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:ring-3 focus:ring-[#3678F1]/10 text-sm transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-neutral-700 text-sm font-medium">Password</label>
                  <Link to="/forgot-password" className="text-xs text-[#3678F1] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="rounded-xl w-full px-4 py-3 pr-11 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:ring-3 focus:ring-[#3678F1]/10 text-sm transition-all disabled:opacity-50"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Inline error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                  <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-snug">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl w-full py-3 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors shadow-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs text-neutral-400">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#3678F1] font-semibold hover:underline">
                Create one free
              </Link>
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-neutral-400">
            By signing in, you agree to our{' '}
            <Link to="#" className="hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="#" className="hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
