import { Link } from 'react-router-dom';
import { FaVideo, FaArrowLeft } from 'react-icons/fa6';

type AppHeaderProps = {
  variant?: 'landing' | 'back';
  backTo?: string;
  backLabel?: string;
};

const navLinks = [
  { label: 'Features',     href: '#features' },
  { label: 'For Pros',     href: '#ecosystem' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
];

export default function AppHeader({ variant = 'landing', backTo = '/', backLabel = 'Back' }: AppHeaderProps) {
  return (
    <header className="h-[64px] border-b border-neutral-200 bg-white shrink-0 flex items-center overflow-hidden sticky top-0 z-50">
      <div className="w-full max-w-6xl mx-auto px-6 flex items-center justify-between gap-4">

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#3B5BDB] flex items-center justify-center shrink-0">
            <FaVideo className="text-white text-sm" />
          </div>
          <span className="text-base text-neutral-900 font-bold">CrewCall</span>
        </Link>

        {variant === 'landing' && (
          <>
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-neutral-500 hover:text-neutral-900 font-medium transition-colors"
                >
                  {link.label}
                </a>
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
