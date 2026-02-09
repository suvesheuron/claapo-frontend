import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from '../components/AppLayout';

export default function Login() {
  useEffect(() => {
    document.title = 'Welcome Back – CrewCall Login';
  }, []);

  return (
    <AppLayout headerVariant="back" backTo="/" backLabel="Back to Home">
      <div className="flex items-center justify-center px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-12 lg:py-20 min-h-[60vh] min-w-0 w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-[540px] min-w-0 max-w-[calc(100vw-2rem)] sm:max-w-[540px]">
          <div className="text-center mb-5 sm:mb-6 md:mb-8 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-neutral-900 mb-2 sm:mb-3 md:mb-4 font-bold break-words">Welcome Back</h1>
            <p className="text-sm sm:text-base md:text-lg text-neutral-600 break-words">Login to access your CrewCall account</p>
          </div>

          <div className="rounded-lg bg-white border border-neutral-200 p-4 sm:p-6 md:p-8 lg:p-12">
            <form className="space-y-4 sm:space-y-6">
              <div className="min-w-0">
                <label className="block text-neutral-900 text-sm mb-2 sm:mb-3 font-medium">Email or Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter your email or phone"
                  className="rounded-lg w-full min-w-0 px-3 sm:px-4 py-3 sm:py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-base"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-neutral-900 text-sm mb-2 sm:mb-3 font-medium">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="rounded-lg w-full min-w-0 px-3 sm:px-4 py-3 sm:py-4 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap min-w-0">
                <label className="flex items-center gap-2 text-neutral-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 border border-neutral-300 rounded" />
                  <span className="text-sm">Remember me</span>
                </label>
                <Link to="#" className="text-sm text-neutral-900 hover:underline">Forgot password?</Link>
              </div>
              <button
                type="submit"
                className="rounded-lg w-full py-3.5 sm:py-4 bg-neutral-900 text-white text-base sm:text-lg hover:bg-neutral-700 font-medium min-h-[44px]"
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

          <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-neutral-500 px-2 break-words">
            By logging in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
