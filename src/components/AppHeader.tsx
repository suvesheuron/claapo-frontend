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
    <header className="h-[68px] border-b border-neutral-100 bg-white/90 backdrop-blur-md shrink-0 flex items-center sticky top-0 z-50 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-[#3B5BDB] flex items-center justify-center shrink-0 group-hover:bg-[#2f4ac2] transition-colors">
            <FaVideo className="text-white text-sm" />
          </div>
          <span className="text-[15px] text-neutral-900 font-bold tracking-tight">CrewCall</span>
        </Link>

        {variant === 'landing' && (
          <>
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="relative px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 font-medium transition-colors duration-200 group"
                >
                  {link.label}
                  {/* Underline that slides left-to-right on hover */}
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#3B5BDB] rounded-full scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-neutral-50"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl px-5 py-2.5 bg-[#3B5BDB] text-white hover:bg-[#2f4ac2] text-sm font-semibold transition-all shadow-sm hover:-translate-y-px"
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
