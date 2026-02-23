import { Link } from 'react-router-dom';
import { FaVideo, FaArrowLeft } from 'react-icons/fa6';

type AppHeaderProps = {
  variant?: 'landing' | 'back';
  backTo?: string;
  backLabel?: string;
};

export default function AppHeader({ variant = 'landing', backTo = '/', backLabel = 'Back' }: AppHeaderProps) {
  return (
    <header className="h-[64px] border-b border-neutral-200 bg-white shrink-0 flex items-center overflow-hidden">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 flex items-center justify-between gap-3 min-w-0">
        <Link to="/" className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#3678F1] flex items-center justify-center shrink-0">
            <FaVideo className="text-white text-sm" />
          </div>
          <span className="text-lg text-neutral-900 font-semibold truncate">CrewCall</span>
        </Link>

        {variant === 'landing' && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 text-sm font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg px-4 py-2 bg-[#3678F1] text-white hover:bg-[#2563d4] text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
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
