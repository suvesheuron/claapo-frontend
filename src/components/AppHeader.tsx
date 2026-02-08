import { Link } from 'react-router-dom';
import { FaVideo, FaArrowLeft } from 'react-icons/fa6';

type AppHeaderProps = {
  variant?: 'landing' | 'back';
  backTo?: string;
  backLabel?: string;
};

export default function AppHeader({ variant = 'landing', backTo = '/', backLabel = 'Back' }: AppHeaderProps) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-16 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
            <FaVideo className="text-white text-xl" />
          </div>
          <span className="text-xl sm:text-2xl text-neutral-900 font-semibold">CrewCall</span>
        </Link>
        {variant === 'landing' && (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="px-4 sm:px-6 py-2.5 text-neutral-700 hover:text-neutral-900 text-sm sm:text-base">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg px-4 sm:px-6 py-2.5 bg-neutral-900 text-white hover:bg-neutral-700 text-sm sm:text-base"
            >
              Register
            </Link>
          </div>
        )}
        {variant === 'back' && (
          <Link to={backTo} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm sm:text-base">
            <FaArrowLeft className="w-4 h-4" aria-hidden />
            <span>{backLabel}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
