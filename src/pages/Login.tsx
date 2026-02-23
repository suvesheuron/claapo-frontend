import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaVideo } from 'react-icons/fa6';
import AppLayout from '../components/AppLayout';

export default function Login() {
  useEffect(() => {
    document.title = 'Welcome Back – CrewCall Login';
  }, []);

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
            <p className="text-sm text-neutral-500 mt-1">Sign in to your CrewCall account</p>
          </div>

          <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm shadow-neutral-100">
            <form className="space-y-4">
              <div>
                <label className="block text-neutral-700 text-sm mb-1.5 font-medium">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  placeholder="you@example.com"
                  className="rounded-xl w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:ring-3 focus:ring-[#3678F1]/10 text-sm transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-neutral-700 text-sm font-medium">Password</label>
                  <Link to="#" className="text-xs text-[#3678F1] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="rounded-xl w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:ring-3 focus:ring-[#3678F1]/10 text-sm transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 border border-neutral-300 rounded accent-[#3678F1] cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-neutral-600 cursor-pointer">
                  Keep me signed in
                </label>
              </div>

              <button
                type="submit"
                className="rounded-xl w-full py-3 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors shadow-sm mt-2"
              >
                Sign In
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
