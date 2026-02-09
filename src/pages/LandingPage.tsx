import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaVideo } from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'CrewCall – Hire Film Crews & Vendors with Confidence';
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white min-w-0 w-full">
      {/* Fixed-height header */}
      <div className="shrink-0">
        <AppHeader variant="landing" />
      </div>

      {/* Main: flex-1, vertically centered, no scroll */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="w-full max-w-2xl mx-auto text-center min-w-0 flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-neutral-900 font-bold leading-tight break-words">
              Hire Film Crews & Vendors with Confidence
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-neutral-600 leading-relaxed break-words max-w-xl">
              CrewCall connects production companies with verified freelance crew members and equipment vendors. Streamline your hiring, manage availability, and lock your team in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto mt-1 sm:mt-2">
              <Link
                to="/dashboard"
                className="inline-flex justify-center items-center rounded-lg bg-neutral-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 font-medium hover:bg-neutral-700 text-sm sm:text-base w-full sm:w-auto min-h-[44px]"
              >
                Hire Crew
              </Link>
              <Link
                to="/register"
                className="inline-flex justify-center items-center rounded-lg border-2 border-neutral-900 text-neutral-900 px-4 sm:px-6 py-2.5 sm:py-3 font-medium hover:bg-neutral-100 text-sm sm:text-base w-full sm:w-auto min-h-[44px]"
              >
                Join as Crew or Vendor
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal footer strip */}
        <footer className="shrink-0 border-t border-neutral-200 py-2 sm:py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center gap-2 order-2 sm:order-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 hidden sm:flex">
                <FaVideo className="text-white text-sm" />
              </div>
              <span className="text-neutral-500 text-xs">© 2025 CrewCall</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 order-1 sm:order-2">
              <Link to="/login" className="text-neutral-500 hover:text-neutral-900 text-xs">
                Login
              </Link>
              <Link to="/register" className="text-neutral-500 hover:text-neutral-900 text-xs">
                Register
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
