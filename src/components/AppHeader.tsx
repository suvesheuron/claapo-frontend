import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { useCallback } from 'react';

type AppHeaderProps = {
  variant?: 'landing' | 'back';
  backTo?: string;
  backLabel?: string;
};

const navLinks = [
  { label: 'Features',     target: 'features' },
  { label: 'For Pros',     target: 'ecosystem' },
  { label: 'How it Works', target: 'how-it-works' },
];

export default function AppHeader({ variant = 'landing', backTo = '/', backLabel = 'Back' }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = useCallback((target: string) => {
    if (location.pathname === '/') {
      // Already on landing page — just scroll
      const el = document.getElementById(target);
      if (el) {
        const headerOffset = 64;
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    } else {
      // On a sub-page — navigate home then scroll after render
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) {
          const headerOffset = 64;
          const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.pathname, navigate]);

  return (
    <header className="h-[64px] border-b border-neutral-200 bg-white shrink-0 flex items-center overflow-hidden sticky top-0 z-50">
      <div className="w-full max-w-6xl mx-auto px-6 flex items-center justify-between gap-4">

        <a
          href="/"
          onClick={(e) => {
            if (location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2 shrink-0"
        >
          <img src="/claapo-logo.svg" alt="Claapo" className="h-8 w-auto" />
        </a>

        {variant === 'landing' && (
          <>
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map(link => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.target)}
                  className="text-sm text-neutral-500 hover:text-neutral-900 font-medium transition-colors cursor-pointer bg-transparent border-none"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/login"
                className="text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors px-2"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full px-5 py-2 bg-[#3B5BDB] text-white hover:bg-[#2f4ac2] text-sm font-semibold transition-all shadow-sm hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </>
        )}

        {variant === 'back' && (
          <Link
            to={backTo}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 text-sm transition-colors"
          >
            <FaArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span className="truncate">{backLabel}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
