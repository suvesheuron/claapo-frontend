import { useState } from 'react';
import { Link } from 'react-router-dom';

const CameraIcon = () => (
  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M4 4h4l2-3h4l2 3h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6h-3.5l-1.5-2h-5l-1.5 2H4zm8 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white min-w-0 w-full">
      {/* Compact header */}
      <header className="shrink-0 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 min-w-0">
          <div className="flex justify-between items-center h-12 sm:h-14 md:h-16 gap-2">
            <Link to="/" className="flex items-center gap-2 text-black min-w-0 shrink-0">
              <CameraIcon />
              <span className="font-bold text-base sm:text-lg truncate">CrewCall</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-3 md:gap-4 shrink-0">
              <Link
                to="/login"
                className="text-black hover:opacity-80 transition text-sm py-2 min-h-[40px] flex items-center"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-black text-white px-3 sm:px-4 py-2 font-medium hover:bg-gray-800 transition rounded-lg text-sm min-h-[40px] flex items-center"
              >
                Register
              </Link>
            </nav>

            <button
              type="button"
              className="sm:hidden p-2 text-black min-h-[40px] min-w-[40px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="sm:hidden py-2 border-t border-gray-200">
              <nav className="flex flex-col gap-1">
                <Link
                  to="/login"
                  className="text-black hover:opacity-80 py-2 min-h-[40px] flex items-center text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-black text-white px-4 py-2.5 font-medium rounded-lg text-center min-h-[40px] flex items-center justify-center text-sm"
                >
                  Register
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main: centered content, fills remaining height */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="w-full max-w-2xl mx-auto text-center min-w-0 flex flex-col items-center gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black leading-tight break-words">
              Hire Film Crews & Vendors with Confidence
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed break-words max-w-xl hidden sm:block">
              CrewCall connects production companies with verified crew and vendors. Streamline hiring and lock your team in one platform.
            </p>
            <p className="text-xs text-gray-600 leading-relaxed break-words max-w-sm sm:hidden">
              Connect with verified crew and vendors. One platform for hiring and bookings.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto mt-1 sm:mt-2">
              <Link
                to="/dashboard"
                className="inline-flex justify-center items-center bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 font-medium hover:bg-gray-800 transition rounded-lg w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
              >
                Hire Crew
              </Link>
              <Link
                to="/register"
                className="inline-flex justify-center items-center bg-white text-black border-2 border-black px-4 sm:px-6 py-2.5 sm:py-3 font-medium hover:bg-gray-50 transition rounded-lg w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
              >
                Join as Crew or Vendor
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal footer strip */}
        <footer className="shrink-0 border-t border-gray-200 py-2 sm:py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-center sm:text-left min-w-0">
            <p className="text-gray-500 text-xs order-2 sm:order-1">
              © 2025 CrewCall
            </p>
            <div className="flex items-center gap-4 order-1 sm:order-2">
              <Link to="/login" className="text-gray-500 hover:text-black text-xs">
                Login
              </Link>
              <Link to="/register" className="text-gray-500 hover:text-black text-xs">
                Register
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
