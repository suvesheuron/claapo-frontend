import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from '../components/AppLayout';

export default function Login() {
  useEffect(() => {
    document.title = 'Welcome Back – CrewCall Login';
  }, []);

  return (
    <AppLayout headerVariant="back" backTo="/" backLabel="Back to Home">
      <div className="flex items-center justify-center px-4 sm:px-8 py-12 sm:py-20">
        <div className="w-full max-w-[540px]">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl text-neutral-900 mb-4 font-bold">Welcome Back</h1>
            <p className="text-lg text-neutral-600">Login to access your CrewCall account</p>
          </div>

          <div className="bg-white border border-neutral-200 p-8 sm:p-12">
            <form className="space-y-6">
              <div>
                <label className="block text-neutral-900 text-sm mb-3 font-medium">Email or Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter your email or phone"
                  className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-neutral-900 text-sm mb-3 font-medium">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-neutral-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 border border-neutral-300 rounded" />
                  <span className="text-sm">Remember me</span>
                </label>
                <Link to="#" className="text-sm text-neutral-900 hover:underline">Forgot password?</Link>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-neutral-900 text-white text-lg hover:bg-neutral-800 font-medium"
              >
                Login
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">or</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-neutral-600">
                Don&apos;t have an account? <Link to="/register" className="text-neutral-900 hover:underline font-medium">Register here</Link>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-neutral-500">
            By logging in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
