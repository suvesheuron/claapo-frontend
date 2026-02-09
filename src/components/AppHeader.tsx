import { Link } from 'react-router-dom';
import { FaVideo, FaArrowLeft } from 'react-icons/fa6';

type AppHeaderProps = {
  variant?: 'landing' | 'back';
  backTo?: string;
  backLabel?: string;
};

export default function AppHeader({ variant = 'landing', backTo = '/', backLabel = 'Back' }: AppHeaderProps) {
  return (
    <header className="border-b border-neutral-200 bg-white shrink-0 overflow-hidden">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-4 sm:py-6 flex items-center justify-between gap-3 min-w-0 overflow-hidden">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
            <FaVideo className="text-white text-lg sm:text-xl" />
          </div>
          <span className="text-lg sm:text-xl md:text-2xl text-neutral-900 font-semibold truncate">CrewCall</span>
        </Link>
        {variant === 'landing' && (
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
            <Link to="/login" className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-neutral-700 hover:text-neutral-900 text-sm sm:text-base whitespace-nowrap">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-neutral-900 text-white hover:bg-neutral-700 text-sm sm:text-base whitespace-nowrap"
            >
              Register
            </Link>
          </div>
        )}
        {variant === 'back' && (
          <Link to={backTo} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm sm:text-base min-w-0">
            <FaArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
            <span className="truncate">{backLabel}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
