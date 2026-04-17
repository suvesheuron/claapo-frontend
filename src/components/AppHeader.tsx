import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBars, FaXmark, FaArrowRightLong, FaSun, FaMoon } from 'react-icons/fa6';
import { useCallback, useEffect, useState } from 'react';
import Logo from './Logo';
import { useTheme } from '../contexts/ThemeContext';

type AppHeaderProps = {
  variant?: 'landing' | 'back';
  backTo?: string;
  backLabel?: string;
};

const navLinks = [
  { label: 'Features',     target: 'features'     },
  { label: 'For Pros',     target: 'ecosystem'    },
  { label: 'How it Works', target: 'how-it-works' },
];

const HEADER_OFFSET = 80;   // matches md:h-[72px] + a small gap

export default function AppHeader({
  variant = 'landing',
  backTo = '/',
  backLabel = 'Back',
}: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === 'dark' ? FaSun : FaMoon;
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  // Subtle elevation when the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [mobileOpen]);

  const scrollToSection = useCallback((target: string) => {
    setMobileOpen(false);
    const doScroll = () => {
      const el = document.getElementById(target);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    };
    if (location.pathname === '/') {
      doScroll();
    } else {
      navigate('/');
      setTimeout(doScroll, 120);
    }
  }, [location.pathname, navigate]);

  return (
    <header
      className={[
        'sticky top-0 z-50 shrink-0 w-full',
        'transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200',
        scrolled
          ? 'bg-white/90 dark:bg-[#05070D]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-[#1F2940] shadow-[0_1px_0_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]'
          : 'bg-white/75 dark:bg-[#0A0E17]/70 backdrop-blur-sm border-b border-transparent',
      ].join(' ')}
    >
      <div className="w-full max-w-7xl mx-auto h-16 md:h-[72px] px-4 sm:px-6 lg:px-8 flex items-center gap-4">

        {variant === 'landing' && (
          <>
            {/* Left: logo — never shrinks below its intrinsic width */}
            <div className="flex md:flex-1 items-center shrink-0">
              <Logo size="md" to="/" ariaLabel="Claapo — back to home" />
            </div>

            {/* Center: nav (desktop only) */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.target)}
                  className="
                    relative text-[13.5px] text-neutral-600 dark:text-neutral-300 hover:text-[#3678F1] dark:hover:text-[#60A5FA]
                    font-semibold px-4 py-2 rounded-lg
                    hover:bg-[#E8F0FE] dark:hover:bg-[#15264A] transition-colors
                    cursor-pointer bg-transparent border-none
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3678F1]/30
                  "
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Right: CTAs (desktop) */}
            <div className="hidden md:flex flex-1 items-center justify-end gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={themeLabel}
                title={themeLabel}
                className="
                  inline-flex items-center justify-center w-10 h-10 rounded-lg
                  text-neutral-600 dark:text-neutral-300 hover:text-[#3678F1] dark:hover:text-[#60A5FA]
                  hover:bg-[#E8F0FE] dark:hover:bg-[#15264A]
                  transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3678F1]/30
                "
              >
                <ThemeIcon className="w-[16px] h-[16px]" aria-hidden />
              </button>
              <Link
                to="/login"
                className="
                  text-[13.5px] text-neutral-700 dark:text-neutral-300 hover:text-[#3678F1] dark:hover:text-[#60A5FA]
                  font-semibold px-3 py-2 rounded-lg transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3678F1]/30
                "
              >
                Log in
              </Link>

              {/* Subtle vertical divider */}
              <span className="w-px h-6 bg-neutral-200 dark:bg-[#1F2940]" aria-hidden />

              <Link
                to="/register"
                className="
                  group inline-flex items-center gap-2 rounded-full
                  pl-5 pr-4 py-2.5
                  bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-[13.5px] font-semibold
                  hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors
                  shadow-brand
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3678F1]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white
                "
              >
                Get Started
                <FaArrowRightLong className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>

            {/* Right: theme toggle + mobile hamburger — fills remaining space, button right-aligned */}
            <div className="flex flex-1 justify-end items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={themeLabel}
                title={themeLabel}
                className="
                  inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0
                  text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#1F2940]
                  hover:bg-[#E8F0FE] dark:hover:bg-[#15264A] hover:border-[#3678F1] dark:hover:border-[#60A5FA] transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3678F1]/30
                "
              >
                <ThemeIcon className="w-[16px] h-[16px]" aria-hidden />
              </button>
              <button
                type="button"
                className="
                  inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0
                  text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#1F2940]
                  hover:bg-[#E8F0FE] dark:hover:bg-[#15264A] hover:border-[#3678F1] dark:hover:border-[#60A5FA] transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3678F1]/30
                "
                onClick={() => setMobileOpen(v => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen
                  ? <FaXmark className="w-5 h-5" aria-hidden />
                  : <FaBars  className="w-5 h-5" aria-hidden />}
              </button>
            </div>
          </>
        )}

        {variant === 'back' && (
          <>
            <Logo size="md" to="/" ariaLabel="Claapo — back to home" />
            <div className="flex-1" />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
              className="
                inline-flex items-center justify-center w-10 h-10 rounded-lg
                text-neutral-600 dark:text-neutral-300 hover:text-[#3678F1] dark:hover:text-[#60A5FA]
                hover:bg-[#E8F0FE] dark:hover:bg-[#15264A]
                transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3678F1]/30
              "
            >
              <ThemeIcon className="w-[16px] h-[16px]" aria-hidden />
            </button>
            <Link
              to={backTo}
              className="
                inline-flex items-center gap-2 px-3.5 py-2 rounded-lg
                text-neutral-600 dark:text-neutral-300 hover:text-[#3678F1] dark:hover:text-[#60A5FA]
                hover:bg-[#E8F0FE] dark:hover:bg-[#15264A]
                text-[13.5px] font-semibold transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3678F1]/30
              "
            >
              <FaArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="truncate">{backLabel}</span>
            </Link>
          </>
        )}
      </div>

      {/* Mobile menu drawer */}
      {variant === 'landing' && mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-[#1F2940] bg-white/95 dark:bg-[#05070D]/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.target)}
                className="
                  w-full text-left text-[15px] text-neutral-700 dark:text-neutral-300 hover:text-[#3678F1] dark:hover:text-[#60A5FA]
                  font-semibold px-3.5 py-3 rounded-xl
                  hover:bg-[#E8F0FE] dark:hover:bg-[#15264A] transition-colors
                "
              >
                {link.label}
              </button>
            ))}
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-[#1F2940] flex flex-col gap-2">
              <Link
                to="/login"
                className="
                  w-full inline-flex items-center justify-center px-4 py-3 rounded-xl
                  bg-white dark:bg-[#141A28] border border-neutral-200/70 dark:border-[#1F2940]
                  text-neutral-700 dark:text-neutral-200 text-sm font-semibold
                  hover:border-[#3678F1] dark:hover:border-[#60A5FA] hover:text-[#3678F1] dark:hover:text-[#60A5FA] transition-colors
                "
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="
                  w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                  bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white text-sm font-semibold
                  hover:from-[#2563EB] hover:to-[#1D4ED8] transition-colors
                  shadow-brand
                "
              >
                Get Started
                <FaArrowRightLong className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
