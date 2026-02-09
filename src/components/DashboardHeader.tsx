import { Link } from 'react-router-dom';
import { FaVideo, FaBell } from 'react-icons/fa6';

type DashboardHeaderProps = {
  userName?: string;
  userAvatar?: string;
};

export default function DashboardHeader({ userName = 'Production Studios Inc.', userAvatar }: DashboardHeaderProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-neutral-200 bg-white shrink-0 overflow-hidden">
      <div className="w-full h-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 flex items-center justify-between gap-2 min-w-0 overflow-hidden">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
            <FaVideo className="text-white text-lg sm:text-xl" />
          </div>
          <span className="text-lg sm:text-xl md:text-2xl text-neutral-900 font-semibold truncate">CrewCall</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 text-neutral-600 hover:text-neutral-900 text-sm min-h-[44px] items-center justify-center">
            <FaBell className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Notifications</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={userAvatar || 'https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=42'}
              alt="Profile"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0"
            />
            <span className="text-sm text-neutral-900 font-medium hidden md:inline truncate max-w-[120px] lg:max-w-none">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
